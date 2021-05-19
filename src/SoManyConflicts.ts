import * as vscode from 'vscode'
import simpleGit, { SimpleGit, StatusResult } from 'simple-git'
import { readFileSync } from 'fs'
import { Parser } from './Parser'
import { ISection } from './ISection'
import { ConflictSection } from './ConflictSection'
import { Identifier } from './Identifier'
import { Conflict } from './Conflict'
// import Graph from 'graph-data-structure'
var Graph = require("graph-data-structure");

export class SoManyConflicts {
  public static async scanAllConflicts(workspace: string): Promise<ISection[]> {
    let message: string = ''
    let allConflictSections: ISection[] = []
    // let uri: vscode.Uri = vscode.Uri.file(
    //   '/Users/symbolk/coding/vscode/vscode-extension-samples/vim-sample/src/extension.ts'
    // )
    // let pos: vscode.Position = new vscode.Position(182, 18)

    // let symbols = await vscode.commands.executeCommand<
    //         vscode.DocumentSymbol[]
    //       >('vscode.executeDocumentSymbolProvider', uri)
    //       if (symbols !== undefined) {
    //         console.log(symbols)
    //       }
    // SoManyConflicts.getRefs(uri, pos).then((refs) => {
    //   if (refs !== undefined) {
    //     console.log(refs)
    //   }
    // })

    // get all files in conflict state in the opened workspace
    try {
      // case1: git repo
      let filePaths: string[] = await this.getConflictingFiles(workspace)
      // TODO: case2: a normal folder
      if (filePaths) {
        for (const path of filePaths) {
          console.log('Start parsing ' + path)
          // scan and parse all conflict blocks
          let absPath: string = workspace + '/' + path
          let content: string = readFileSync(absPath, 'utf-8')
          let uri: vscode.Uri = vscode.Uri.file(absPath)

          const sections: ISection[] = Parser.parse(uri, content)
          const conflictSections: ISection[] = sections.filter(
            (sec) => sec instanceof ConflictSection
          )

          // extract identifiers in the whole file
          let symbols = await vscode.commands.executeCommand<
            vscode.DocumentSymbol[]
          >('vscode.executeDocumentSymbolProvider', uri)
          if (symbols !== undefined) {
            // will ignore those non-code files (e.g., readme, gradle)
            for (let conflictSection of conflictSections) {
              let conflict = (<ConflictSection>conflictSection).getConflict()
              // filter symbols involved in each conflict block
              this.filterConflictingSymbols(conflict, symbols)
              allConflictSections.push(conflictSection)
            }

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
    let graph = Graph()
    graph.addNode('a')
    graph.addNode('b')
    graph.addEdge('a', 'b')
    graph.addEdge('b', 'c')
    console.log(graph.topologicalSort())
    // compare each side identifiers

    // construct edges

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

  public static async getConflictingFiles(path: string): Promise<string[]> {
    const git: SimpleGit = simpleGit(path)
    // const status: StatusResult = await git.status();

    return new Promise((resolve, reject) => {
      git.diff(
        ['--name-only', '--diff-filter=U'],
        (err: any | null, result?: any) => {
          if (err) {
            reject(err)
          } else {
            let filePaths: string[] = result.split(/\r\n|\r|\n/)
            resolve(filePaths.filter((s) => s.length > 0))
          }
        }
      )
    })
  }
}
