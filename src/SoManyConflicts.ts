import * as vscode from 'vscode'
import { Parser } from './Parser'
import { ConflictSection } from './ConflictSection'
import { Symbol } from './Symbol'
import { Conflict } from './Conflict'
import { FileUtils } from './FileUtils'
import { AlgUtils } from './AlgUtils'
const graphlib = require('@dagrejs/graphlib')
import * as TreeSitter from 'tree-sitter'
import { Identifier } from './Identifier'
import { Constants } from './Constants'
import { Language } from './Language'
import { getStrategy, Strategy } from './Strategy'
// import { Point, SyntaxNode, Tree, Query, QueryMatch, QueryCapture } from 'tree-sitter'
// const JavaScript = require('tree-sitter-javascript')
const TypeScript = require('tree-sitter-typescript').typescript
const treeSitter = new TreeSitter()
treeSitter.setLanguage(TypeScript)

export class SoManyConflicts {
  public static scanConflictsInFile(absPath: string, content?: string): ConflictSection[] {
    if (!content) {
      content = FileUtils.readFileContent(absPath)
    }
    let uri: vscode.Uri = vscode.Uri.file(absPath)
    const conflictSections: ConflictSection[] = Parser.parse(uri, content).filter((sec) => sec instanceof ConflictSection) as ConflictSection[]
    conflictSections.forEach((conflictSection) => console.log(conflictSection.printLineRange()))

    return conflictSections
  }

  public static async scanAllConflicts(workspace: string): Promise<Map<string, ConflictSection[]>> {
    let message: string = ''
    let sectionsByFile = new Map<string, ConflictSection[]>()

    // get all files in conflict state in the opened workspace
    try {
      let filePaths: string[] = await FileUtils.getConflictingFilePaths(workspace)
      if (filePaths.length == 0) {
        message = 'Found no conflicting files in the workspace!'
        vscode.window.showWarningMessage(message)
        return sectionsByFile
      }
      for (const absPath of filePaths) {
        console.log('Start parsing ' + absPath)
        // scan and parse all conflict blocks
        const conflictSections: ConflictSection[] = this.scanConflictsInFile(absPath)
        let uri: vscode.Uri = vscode.Uri.file(absPath)
        let language: Language = FileUtils.detectLanguage(absPath)

        // extract identifiers in the whole file
        /* P.S. actually the symbol provider is quite unreliable
         * it often fails to return ALL symbols but only 1-st level (for the issues of LS on conflicting files)
         * so avoid counting on pure language service
         */
        let symbols = (await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', uri)) as vscode.DocumentSymbol[]
        for (let conflictSection of conflictSections) {
          let conflict: Conflict = conflictSection.conflict
          // LSP: filter symbols involved in each conflict block
          if (symbols !== undefined) {
            this.filterConflictingSymbols(conflict, symbols)
          }
          // AST: extract identifiers (def/use) to complement LSP results
          this.extractConflictingIdentifiers(conflict, language)
        }
        sectionsByFile.set(uri.fsPath, conflictSections)
      }
    } catch (err) {
      vscode.window.showErrorMessage(err.message)
      return sectionsByFile
    }
    return sectionsByFile
  }

  private static extractConflictingIdentifiers(conflict: Conflict, language: Language) {
    conflict.base.identifiers = this.analyzeCode(conflict.base.lines, language)
    conflict.ours.identifiers = this.analyzeCode(conflict.ours.lines, language)
    conflict.theirs.identifiers = this.analyzeCode(conflict.theirs.lines, language)
  }

  private static analyzeCode(codeLines: string[], language: Language): Identifier[] {
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
    // TODO: should use set?
    let identifiers: Identifier[] = []
    let queryString = ''
    switch (language) {
      case Language.Java:
        queryString = Constants.javaQuery
        break
      case Language.JavaScript:
        queryString = Constants.javaScriptQuery
        break
      case Language.TypeScript:
        queryString = Constants.typeScriptQuery
        break
      case Language.Python:
        queryString = Constants.pythonQuery
        break
      default:
        queryString = ''
    }

    if (queryString.length > 0) {
      const tree: TreeSitter.Tree = treeSitter.parse(codeLines.join('\n'))
      const query = new TreeSitter.Query(TypeScript, Constants.typeScriptQuery)
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
    }

    return identifiers
  }

  public static constructGraph(allConflictSections: ConflictSection[]) {
    // let graph = new graphlib.Graph({ directed: true, multigraph: true })
    let graph = new graphlib.Graph({ multigraph: true })

    // construct graph nodes
    for (let conflictSection of allConflictSections) {
      graph.setNode(conflictSection.index, { file_path: conflictSection.conflict.uri?.fsPath, range: conflictSection.printLineRange() })
    }

    // for each pair of conflicts
    let i,
      j: number = 0
    // construct graph edges
    for (i = 0; i < allConflictSections.length; ++i) {
      let conflict1: Conflict = allConflictSections[i].conflict
      let index1 = allConflictSections[i].index
      for (j = i + 1; j < allConflictSections.length; ++j) {
        let conflict2: Conflict = allConflictSections[j].conflict
        let index2 = allConflictSections[j].index
        let dependency = AlgUtils.computeDependency(conflict1, conflict2)
        if (dependency > 0) {
          let lastWeight = graph.edge(index1, index2)
          if (lastWeight == undefined) {
            graph.setEdge(index1, index2, dependency)
          } else {
            graph.setEdge(index1, index2, lastWeight + dependency)
          }
        }
        let similarity = AlgUtils.computeSimilarity(conflict1, conflict2)
        if (similarity > 0.5) {
          graph.setEdge(index1, index2, similarity)
        }
      }
    }
    return graph
  }

  public static suggestStartingPoint(allConflictSections: ConflictSection[], graph: any): ConflictSection[][] {
    let groupedConflictSections: ConflictSection[][] = []
    let components = graphlib.alg.components(graph)
    components.sort(function (a: [], b: []) {
      // ASC  -> a.length - b.length
      // DESC -> b.length - a.length
      return b.length - a.length
    })
    for (let component of components) {
      if (component.length > 0) {
        let sections: ConflictSection[] = []
        for (let element of component) {
          let index: number = +element
          sections.push(allConflictSections[index])
        }
        groupedConflictSections.push(sections)
      }
    }
    return groupedConflictSections
  }

  public static suggestResolutionStrategy(allConflictSections: ConflictSection[], conflictIndex: number, decorationType: vscode.TextEditorDecorationType) {
    let activeEditor = vscode.window.activeTextEditor
    if (!activeEditor) {
      return
    }

    let focused: ConflictSection = this.getConflictSectionByIndex(allConflictSections, conflictIndex)
    let suggestedStrategy: Strategy = getStrategy(focused.strategiesProb)
    if (suggestedStrategy != Strategy.Unknown) {
      const decorationOptions: vscode.DecorationOptions[] = []
      decorationOptions.push({ range: focused.conflict.ours.range, hoverMessage: 'Suggest to ' + focused.stragegy.display })
      // decorationOptions.push({ range: focused.conflict.ours.range, hoverMessage: 'Suggest to Accept Current Change' })
      activeEditor.setDecorations(decorationType, decorationOptions)
      // FIXME: remove decorations after accepted
    }
  }

  public static suggestRelatedConflicts(allConflictSections: ConflictSection[], conflictIndex: number, graph: any) {
    let focusedConflict: Conflict = this.getConflictByIndex(allConflictSections, conflictIndex)
    let locations: vscode.Location[] = []
    let edges = graph.nodeEdges(conflictIndex)
    if (edges) {
      for (let edge of edges) {
        if (!isNaN(+edge.v)) {
          if (+edge.v != conflictIndex) {
            let conflict = this.getConflictByIndex(allConflictSections, +edge.v)
            locations.push(new vscode.Location(conflict.uri!, conflict.base.range))
          }
        }
        if (!isNaN(+edge.w)) {
          if (+edge.w != conflictIndex) {
            let conflict = this.getConflictByIndex(allConflictSections, +edge.w)
            locations.push(new vscode.Location(conflict.uri!, conflict.base.range))
          }
        }
      }
    }

    if (edges.length == 0 || locations.length == 0) {
      vscode.window.showWarningMessage('Found no related conflicts for this conflict.')
    } else {
      vscode.commands.executeCommand('editor.action.peekLocations', focusedConflict.uri, focusedConflict.ours.range.start, locations, 'peek')
    }
  }

  private static getConflictByIndex(allConflictSections: ConflictSection[], index: number): Conflict {
    return allConflictSections[index].conflict
  }

  public static getConflictSectionByIndex(allConflictSections: ConflictSection[], index: number): ConflictSection {
    return allConflictSections[index]
  }

  private static async filterConflictingSymbols(conflict: Conflict, symbols: vscode.DocumentSymbol[]) {
    for (let symbol of symbols) {
      if (conflict.ours.range.contains(symbol.selectionRange)) {
        let refs = await this.getRefs(conflict.uri!, this.middlePosition(symbol.selectionRange))
        // cache symbols and refs in ConflictSections
        conflict.addOurIdentifier(new Symbol(symbol, refs == undefined ? [] : refs))
      }
      if (conflict.base.range.contains(symbol.selectionRange)) {
        let refs = await this.getRefs(conflict.uri!, this.middlePosition(symbol.selectionRange))
        // cache symbols and refs in ConflictSections
        conflict.addBaseIdentifier(new Symbol(symbol, refs == undefined ? [] : refs))
      }
      if (conflict.theirs.range.contains(symbol.selectionRange)) {
        let refs = await this.getRefs(conflict.uri!, this.middlePosition(symbol.selectionRange))
        // cache symbols and refs in ConflictSections
        conflict.addTheirIdentifier(new Symbol(symbol, refs == undefined ? [] : refs))
      }
      if (symbol.children.length > 0) {
        this.filterConflictingSymbols(conflict, symbol.children)
      }
    }
  }
  private static middlePosition(range: vscode.Range): vscode.Position {
    return new vscode.Position(Math.round((range.start.line + range.end.line) / 2), Math.round((range.start.character + range.end.character) / 2))
  }

  private static async getRefs(uri: vscode.Uri, position: vscode.Position): Promise<vscode.Location[] | undefined> {
    // let refs = undefined
    let refs = await vscode.commands.executeCommand<vscode.Location[]>('vscode.executeReferenceProvider', uri, position)
    return refs
  }
}
