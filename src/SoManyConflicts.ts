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
const graphlib = require('@dagrejs/graphlib')
import * as TreeSitter from 'tree-sitter'
import { Identifier } from './Identifier'
import { Constants } from './Constants'
// import { Point, SyntaxNode, Tree, Query, QueryMatch, QueryCapture } from 'tree-sitter'
// const JavaScript = require('tree-sitter-javascript')
const TypeScript = require('tree-sitter-typescript').typescript
const treeSitter = new TreeSitter()
treeSitter.setLanguage(TypeScript)

export class SoManyConflicts {
  public static async scanAllConflicts(
    workspace: string
  ): Promise<Map<Uri, ISection[]>> {
    let message: string = ''
    let conflictSectionsByFile = new Map<Uri, ISection[]>()

    // get all files in conflict state in the opened workspace
    try {
      let filePaths: string[] = await FileUtils.getConflictingFilePaths(
        workspace
      )
      if (filePaths.length == 0) {
        message = 'Found no conflicting files in the workspace!'
        window.showWarningMessage(message)
        return conflictSectionsByFile
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

          console.log(conflictSection)
        }
        conflictSectionsByFile.set(uri, conflictSections)
      }
    } catch (err) {
      window.showErrorMessage(err.message)
      return conflictSectionsByFile
    }
    return conflictSectionsByFile
  }

  private static extractConflictingIdentifiers(conflict: Conflict) {
    conflict.base.identifiers = this.analyzeCode(conflict.base.lines)
    conflict.ours.identifiers = this.analyzeCode(conflict.ours.lines)
    conflict.theirs.identifiers = this.analyzeCode(conflict.theirs.lines)
  }

  private static analyzeCode(codeLines: string[]): Identifier[] {
    // const tree: TreeSitter.Tree = treeSitter.parse(
    //   (index: number, position: TreeSitter.Point) => {
    //     let line = codeLines[position.row]
    //     if (line) {
    //       return line.slice(position.column)
    //     } else {
    //       return ''
    //     }
    //   }
    // )
    const tree: TreeSitter.Tree = treeSitter.parse(codeLines.join('\n'))
    // console.log(tree.rootNode.toString())

    const query = new TreeSitter.Query(TypeScript, Constants.typeScriptQuery)

    let identifiers: Identifier[] = []
    const matches: TreeSitter.QueryMatch[] = query.matches(tree.rootNode)
    for (let match of matches) {
      const captures: TreeSitter.QueryCapture[] = match.captures
      for (let capture of captures) {
        if (capture.node !== undefined) {
          if (capture.node.text !== undefined) {
            identifiers.push(new Identifier(capture.name, capture.node.text))
          }
        }
      }
    }
    return identifiers
  }

  public static constructGraph(allConflictSections: ISection[]) {
    let graph = new graphlib.Graph({ directed: true })

    // for each pair of conflicts
    let i,
      j: number = 0

    // construct graph nodes
    for (i = 0; i < allConflictSections.length; ++i) {
      graph.setNode(i, { label: i })
    }

    // construct graph edges
    for (i = 0; i < allConflictSections.length; ++i) {
      let conflict1: Conflict = (<ConflictSection>allConflictSections[i])
        .conflict
      for (j = i + 1; j < allConflictSections.length; ++j) {
        let conflict2: Conflict = (<ConflictSection>allConflictSections[j])
          .conflict
        let weight = AlgUtils.estimateRelevance(conflict1, conflict2)
        if (weight > 0) {
          let lastWeight = graph.edge()
          if (lastWeight == undefined) {
            graph.setEdge(i, j, weight)
          } else {
            graph.setEdge(i, j, lastWeight + weight)
          }
        }
      }
    }
    return graph
  }

  public static suggestStartingPoint(
    allConflictSections: ISection[],
    graph: any
  ): ISection[][] {
    let groupedConflictSections: ISection[][] = []
    let components = graphlib.alg.components(graph)
    components.sort(function (a: [], b: []) {
      // ASC  -> a.length - b.length
      // DESC -> b.length - a.length
      return b.length - a.length
    })
    for (let component of components) {
      if (component.length > 0) {
        let sections: ISection[] = []
        for (let element of component) {
          let index: number = +element
          sections.push(allConflictSections[index])
        }
        groupedConflictSections.push(sections)
      }
    }
    return groupedConflictSections
  }

  public static suggestResolutionStrategy(
    allConflictSections: ISection[],
    conflictIndex: number,
    graph: any
  ) {
    console.log('No suggestion.')
  }

  public static suggestRelatedConflicts(
    allConflictSections: ISection[],
    conflictIndex: number,
    graph: any
  ) {
    graph.nodeEdges()
    let conflict: Conflict = (<ConflictSection>(
      allConflictSections[conflictIndex]
    )).conflict
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
}
