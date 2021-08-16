import * as vscode from 'vscode'
import * as path from 'path'
import { Parser } from './Parser'
import { ConflictSection } from './ConflictSection'
import { Symbol } from './Symbol'
import { Conflict } from './Conflict'
import { FileUtils } from './FileUtils'
import { AlgUtils } from './AlgUtils'
const graphlib = require('@dagrejs/graphlib')
import * as TreeSitter from 'web-tree-sitter'
import { Identifier } from './Identifier'
import { Language, languages } from './Language'
import { getStrategy, Strategy } from './Strategy'

export class SoManyConflicts {
  /** singleton treesitter instances for different languages */
  private static queriers = new Map<Language, [TreeSitter, TreeSitter.Query]>()

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
      if (filePaths.length === 0) {
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
          if (symbols != null) {
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

  private static async extractConflictingIdentifiers(conflict: Conflict, language: Language) {
    conflict.base.identifiers = await this.analyzeCode(conflict.base.lines, language)
    conflict.ours.identifiers = await this.analyzeCode(conflict.ours.lines, language)
    conflict.theirs.identifiers = await this.analyzeCode(conflict.theirs.lines, language)
  }

  private static async analyzeCode(codeLines: string[], language: Language): Promise<Identifier[]> {
    let identifiers: Identifier[] = []

    // early return if we don't support the language
    const { create, queryString } = languages[language] || {}
    if (!queryString) return []

    // store the tree sitter instance for later use
    let instance = this.queriers.get(language)
    if (!instance) {
      const specification = create()
      const treeSitter = await this.initParser(language)
      const treeQuery = new TreeSitter.Query()
      instance = [treeSitter, treeQuery]
      this.queriers.set(language, instance)
    }

    try {
      const tree: TreeSitter.Tree = instance[0].parse(codeLines.join('\n'))
      const matches: TreeSitter.QueryMatch[] = instance[1].matches(tree.rootNode)
      for (let match of matches) {
        const captures: TreeSitter.QueryCapture[] = match.captures
        for (let capture of captures) {
          if (capture.node != null) {
            if (capture.node.text != null) {
              identifiers.push(new Identifier(capture.name, capture.node.text))
            }
          }
        }
      }
    } catch (error) {
      console.log(error)
    }
    return identifiers
  }

  private static async initParser(language: Language) {
    await TreeSitter.init()
    const parser = new TreeSitter()

    let langFile = path.join(__dirname, '../parsers', language.toLowerCase + '.wasm')
    const langObj = await TreeSitter.Language.load(langFile)
    parser.setLanguage(langObj)
    return parser
  }

  public static constructGraph(allConflictSections: ConflictSection[]) {
    // let graph = new graphlib.Graph({ directed: true, multigraph: true })
    // let graph = new graphlib.Graph({ multigraph: true })
    let graph = new graphlib.Graph()

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
          if (lastWeight == null) {
            graph.setEdge(index1, index2, dependency)
          } else {
            graph.setEdge(index1, index2, lastWeight + dependency)
          }
        }
        let similarity = AlgUtils.computeSimilarity(conflict1, conflict2)
        if (similarity > 0.5) {
          let lastWeight = graph.edge(index1, index2)
          if (lastWeight == null) {
            graph.setEdge(index1, index2, similarity)
          } else {
            graph.setEdge(index1, index2, lastWeight + similarity)
          }
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
    if (suggestedStrategy !== Strategy.Unknown) {
      const decorationOptions: vscode.DecorationOptions[] = []
      switch (suggestedStrategy) {
        case Strategy.AcceptOurs:
          decorationOptions.push({ range: focused.conflict.ours.range, hoverMessage: 'Suggest to ' + suggestedStrategy.display })
          break
        case Strategy.AcceptTheirs:
          decorationOptions.push({ range: focused.conflict.theirs.range, hoverMessage: 'Suggest to ' + suggestedStrategy.display })
          break
        case Strategy.AcceptBase:
          decorationOptions.push({ range: focused.conflict.base.range, hoverMessage: 'Suggest to ' + suggestedStrategy.display })
          break
        case Strategy.AcceptBoth:
          decorationOptions.push({ range: focused.conflict.ours.range, hoverMessage: 'Suggest to ' + suggestedStrategy.display })
          decorationOptions.push({ range: focused.conflict.theirs.range, hoverMessage: 'Suggest to ' + suggestedStrategy.display })
          break
      }
      if (decorationOptions.length > 0) {
        activeEditor.setDecorations(decorationType, decorationOptions)
      } else {
        vscode.window.showInformationMessage('Suggest to ' + suggestedStrategy.display)
      }
    } else {
      vscode.window.showWarningMessage('No suggestion for this conflict.')
    }
  }

  public static suggestRelatedConflicts(allConflictSections: ConflictSection[], conflictIndex: number, graph: any) {
    let focusedConflict: Conflict = this.getConflictByIndex(allConflictSections, conflictIndex)
    let locations: vscode.Location[] = []
    let edges = graph.nodeEdges(conflictIndex)
    if (edges) {
      for (let edge of edges) {
        if (!isNaN(+edge.v)) {
          if (+edge.v !== conflictIndex) {
            let conflict = this.getConflictByIndex(allConflictSections, +edge.v)
            locations.push(new vscode.Location(conflict.uri!, conflict.base.range))
          }
        }
        if (!isNaN(+edge.w)) {
          if (+edge.w !== conflictIndex) {
            let conflict = this.getConflictByIndex(allConflictSections, +edge.w)
            locations.push(new vscode.Location(conflict.uri!, conflict.base.range))
          }
        }
      }
    }

    if (edges.length === 0 || locations.length === 0) {
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
        conflict.addOurIdentifier(new Symbol(symbol, refs == null ? [] : refs))
      }
      if (conflict.base.range.contains(symbol.selectionRange)) {
        let refs = await this.getRefs(conflict.uri!, this.middlePosition(symbol.selectionRange))
        // cache symbols and refs in ConflictSections
        conflict.addBaseIdentifier(new Symbol(symbol, refs == null ? [] : refs))
      }
      if (conflict.theirs.range.contains(symbol.selectionRange)) {
        let refs = await this.getRefs(conflict.uri!, this.middlePosition(symbol.selectionRange))
        // cache symbols and refs in ConflictSections
        conflict.addTheirIdentifier(new Symbol(symbol, refs == null ? [] : refs))
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
