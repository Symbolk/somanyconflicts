import {
  window,
  TextEditor,
  Uri,
  Range,
  Location,
  Position,
  commands,
  DocumentSymbol,
} from 'vscode'
import { Parser } from './Parser'
import { ISection } from './ISection'
import { ConflictSection } from './ConflictSection'
import { Symbol } from './Symbol'
import { Conflict } from './Conflict'
import { FileUtils } from './FileUtils'
import { AlgUtils } from './AlgUtils'
var graphlib = require('@dagrejs/graphlib')

export class SoManyConflicts {
  public static async scanAllConflicts(workspace: string): Promise<ISection[]> {
    let message: string = ''
    let allConflictSections: ISection[] = []

    // get all files in conflict state in the opened workspace
    try {
      let filePaths: string[] = await FileUtils.getConflictingFilePaths(
        workspace
      )
      if (filePaths.length == 0) {
        message = 'Found no conflicting files in the workspace!'
        window.showWarningMessage(message)
        return allConflictSections
      }
      for (const absPath of filePaths) {
        console.log('Start parsing ' + absPath)
        // scan and parse all conflict blocks
        let content: string = FileUtils.readFileContent(absPath)
        let uri: Uri = Uri.file(absPath)

        const sections: ISection[] = Parser.parse(uri, content)
        const conflictSections: ISection[] = sections.filter(
          (sec) => sec instanceof ConflictSection
        )

        // extract identifiers in the whole file
        /* P.S. actually the symbol provider is quite unreliable
         * it often fails to return ALL symbols but only 1-st level (for the issues of LS on conflicting files)
         * so avoid counting on pure language service
         */
        let symbols = (await commands.executeCommand(
          'vscode.executeDocumentSymbolProvider',
          uri
        )) as DocumentSymbol[]
        for (let conflictSection of conflictSections) {
          let conflict: Conflict = (<ConflictSection>conflictSection).conflict
          // LSP: filter symbols involved in each conflict block
          if (symbols !== undefined) {
            this.filterConflictingSymbols(conflict, symbols)
          }
          // AST: extract identifiers (def/use) to complement LSP results
          this.extractConflictingIdentifiers(conflict)

          allConflictSections.push(conflictSection)

          console.log(conflictSection)
        }
      }
    } catch (err) {
      window.showErrorMessage(err.message)
    }
    return allConflictSections
  }
  private static extractConflictingIdentifiers(conflict: Conflict) {
    console.log(conflict.ours)
  }

  public static constructGraph(allConflictSections: ISection[]) {
    let graph = new graphlib.Graph({ directed: true })

    // for each pair of conflicts
    let i,
      j: number = 0

    // construct graph nodes
    for (i = 0; i < allConflictSections.length - 1; ++i) {
      graph.setNode(i.toString())
    }

    // construct graph edges
    for (i = 0; i < allConflictSections.length - 1; ++i) {
      let conflict1: Conflict = (<ConflictSection>allConflictSections[i])
        .conflict
      for (j = i + 1; j < allConflictSections.length; ++j) {
        let conflict2: Conflict = (<ConflictSection>allConflictSections[j])
          .conflict
        let weight = AlgUtils.estimateRelevance(conflict1, conflict2)
        if (weight > 0) {
          let lastWeight = graph.edge()
          if (lastWeight == undefined) {
            graph.setEdge(i.toString, j.toString, weight)
          } else {
            graph.setEdge(i.toString, j.toString, lastWeight + weight)
          }
        }
      }
    }
    return graph
  }

  public static suggestStartingPoint(
    allConflictSections: ISection[],
    graph: any
  ) {
    // console.log(graphlib.alg.topsort(graph))
  }

  public static suggestResolutionStrategy(
    allConflictSections: ISection[],
    graph: any
  ) {
    console.log('No suggestion.')
  }

  static suggestNextConflict(
    allConflictSections: ISection[],
    conflict: Conflict,
    graph: any
  ) {
    let locations: Location[] = []
    locations.push(new Location(conflict.uri!, conflict.theirs.range.start))
    locations.push(new Location(conflict.uri!, conflict.base.range.start))

    commands.executeCommand(
      'editor.action.peekLocations',
      conflict.uri,
      conflict.ours.range.start,
      locations,
      'peek'
    )
    console.log(conflict)
  }

  private static async filterConflictingSymbols(
    conflict: Conflict,
    symbols: DocumentSymbol[]
  ) {
    for (let symbol of symbols) {
      if (conflict.ours.range.contains(symbol.selectionRange)) {
        let refs = await this.getRefs(
          conflict.uri!,
          this.middlePosition(symbol.selectionRange)
        )
        // cache symbols and refs in ConflictSections
        conflict.addOurIdentifier(
          new Symbol(symbol, refs == undefined ? [] : refs)
        )
      }
      if (conflict.base.range.contains(symbol.selectionRange)) {
        let refs = await this.getRefs(
          conflict.uri!,
          this.middlePosition(symbol.selectionRange)
        )
        // cache symbols and refs in ConflictSections
        conflict.addBaseIdentifier(
          new Symbol(symbol, refs == undefined ? [] : refs)
        )
      }
      if (conflict.theirs.range.contains(symbol.selectionRange)) {
        let refs = await this.getRefs(
          conflict.uri!,
          this.middlePosition(symbol.selectionRange)
        )
        // cache symbols and refs in ConflictSections
        conflict.addTheirIdentifier(
          new Symbol(symbol, refs == undefined ? [] : refs)
        )
      }
      if (symbol.children.length > 0) {
        this.filterConflictingSymbols(conflict, symbol.children)
      }
    }
  }
  private static middlePosition(range: Range): Position {
    return new Position(
      Math.round((range.start.line + range.end.line) / 2),
      Math.round((range.start.character + range.end.character) / 2)
    )
  }

  private static async getRefs(
    uri: Uri,
    position: Position
  ): Promise<Location[] | undefined> {
    // let refs = undefined
    let refs = await commands.executeCommand<Location[]>(
      'vscode.executeReferenceProvider',
      uri,
      position
    )
    return refs
  }

  public static findConflictContainingSelection(
    editor: TextEditor | undefined,
    conflicts?: Conflict[]
  ): Conflict | null {
    if (!editor) {
      return null
    }

    if (!conflicts) {
      const sections: ISection[] = Parser.parse(
        editor.document.uri,
        editor.document.getText()
      )
      for (let section of sections) {
        if (section instanceof ConflictSection) {
          conflicts!.push((<ConflictSection>section).conflict)
        }
      }
    }

    if (!conflicts || conflicts.length === 0) {
      return null
    }

    for (const conflict of conflicts) {
      if (conflict.range.contains(editor.selection.active)) {
        return conflict
      }
    }

    return null
  }
}
