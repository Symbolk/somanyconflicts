import * as vscode from 'vscode'
import { Parser } from './Parser'
import { ISection } from './ISection'
import { ConflictSection } from './ConflictSection'
import { Identifier } from './Identifier'
import { Conflict } from './Conflict'
import { FileUtils } from './FileUtils'
var graphlib = require('@dagrejs/graphlib')

export class SoManyConflicts {
  public static async scanAllConflicts(workspace: string): Promise<ISection[]> {
    let message: string = ''
    let allConflictSections: ISection[] = []

    // get all files in conflict state in the opened workspace
    try {
      let filePaths: string[] = await FileUtils.getConflictingFiles(workspace)
      if (filePaths) {
        for (const path of filePaths) {
          console.log('Start parsing ' + path)
          // scan and parse all conflict blocks
          let absPath: string = workspace + '/' + path
          let content: string = FileUtils.readFileContent(absPath)
          let uri: vscode.Uri = vscode.Uri.file(absPath)

          const sections: ISection[] = Parser.parse(uri, content)
          const conflictSections: ISection[] = sections.filter(
            (sec) => sec instanceof ConflictSection
          )

          // extract identifiers in the whole file
          // P.S. actually the symbol provider is quite unreliable, it often fails to return ALL symbols but only 1-st level
          // so avoid counting on pure language service
          let symbols = (await vscode.commands.executeCommand(
            'vscode.executeDocumentSymbolProvider',
            uri
          )) as vscode.DocumentSymbol[]
          for (let conflictSection of conflictSections) {
            let conflict = (<ConflictSection>conflictSection).getConflict()
            // filter symbols involved in each conflict block
            if (symbols !== undefined) {
              this.filterConflictingSymbols(conflict, symbols)
            }
            // TODO: extract tokens in case that LS fails to resolve
            allConflictSections.push(conflictSection)

            console.log(conflictSections)
          }
        }
      }
      console.log()
    } catch (err) {
      vscode.window.showInformationMessage(err.message)
    }
    return allConflictSections
  }

  public static constructGraph(allConflictSections: ISection[]) {
    // for each pair

    let i,
      j: number = 0
    for (i = 0; i < allConflictSections.length - 1; ++i) {
      let conflict1: Conflict = (<ConflictSection>(
        allConflictSections[i]
      )).getConflict()
      for (j = i + 1; j < allConflictSections.length; ++j) {
        let conflict2: Conflict = (<ConflictSection>(
          allConflictSections[j]
        )).getConflict()
      }
    }
    let graph = new graphlib.Graph({ directed: true })
    graph.setNode('a')
    graph.setNode('b')
    graph.setEdge('a', 'b')
    graph.setEdge('b', 'c')
    console.log(graphlib.alg.topsort(graph))

    // construct graph

    // return graph
  }

  private static async filterConflictingSymbols(
    conflict: Conflict,
    symbols: vscode.DocumentSymbol[]
  ) {
    for (let symbol of symbols) {
      if (conflict.ourRange.contains(symbol.selectionRange)) {
        let refs = await this.getRefs(
          conflict.uri!,
          this.middlePosition(symbol.selectionRange)
        )
        // cache symbols and refs in ConflictSections
        conflict.addOurIdentifier(
          new Identifier(symbol, refs == undefined ? [] : refs)
        )
      }
      if (conflict.originalRange.contains(symbol.selectionRange)) {
        let refs = await this.getRefs(
          conflict.uri!,
          this.middlePosition(symbol.selectionRange)
        )
        // cache symbols and refs in ConflictSections
        conflict.addOriginalIdentifier(
          new Identifier(symbol, refs == undefined ? [] : refs)
        )
      }
      if (conflict.theirRange.contains(symbol.selectionRange)) {
        let refs = await this.getRefs(
          conflict.uri!,
          this.middlePosition(symbol.selectionRange)
        )
        // cache symbols and refs in ConflictSections
        conflict.addTheirIdentifier(
          new Identifier(symbol, refs == undefined ? [] : refs)
        )
      }
      if (symbol.children.length > 0) {
        this.filterConflictingSymbols(conflict, symbol.children)
      }
    }
  }
  private static middlePosition(range: vscode.Range): vscode.Position {
    return new vscode.Position(
      Math.round((range.start.line + range.end.line) / 2),
      Math.round((range.start.character + range.end.character) / 2)
    )
  }

  private static async getRefs(
    uri: vscode.Uri,
    position: vscode.Position
  ): Promise<vscode.Location[] | undefined> {
    let refs = await vscode.commands.executeCommand<vscode.Location[]>(
      'vscode.executeReferenceProvider',
      uri,
      position
    )
    return refs
  }
}
