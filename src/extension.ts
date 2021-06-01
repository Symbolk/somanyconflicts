import {
  conflictSectionsToTreeItem,
  ConflictTreeItem,
  ConflictTreeViewProvider,
} from './ConflictTreeView'
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { Conflict } from './Conflict'
import { ConflictLensProvider } from './ConflictLensProvider'
import { ISection } from './ISection'
import { SoManyConflicts } from './SoManyConflicts'
var Graph = require('@dagrejs/graphlib').Graph

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "somanyconflicts" is now active!'
  )

  let message: string = ''
  // raw conflict blocks
  let allConflictSections: ISection[] = []
  let graph: typeof Graph | undefined = undefined

  addSubcommandOpenFile(context)

  let [suggestedConflictTreeRoot, suggestedConflictTreeViewProvider] = createTree('suggestedConflictTreeView')
  let [allConflictTreeRoot, allConflictTreeViewProvider] = createTree('allConflictTreeView')

  // feature1: topo-sort for the optimal order to resolve conflicts
  context.subscriptions.push(
    vscode.commands.registerCommand('somanyconflicts.somany', async () => {
      if (!isReady()) {
        await init()
      }
      message = `Finding the starting point to resolve conflicts...`
      vscode.window.showInformationMessage(message)
      let suggestions: ISection[] = SoManyConflicts.suggestStartingPoint(
        allConflictSections,
        graph
      )

      conflictSectionsToTreeItem(suggestions, suggestedConflictTreeRoot).then((res) => {
        suggestedConflictTreeViewProvider.refresh()
        vscode.commands.executeCommand('suggestedConflictTreeView.focus')
      })
      conflictSectionsToTreeItem(suggestions, allConflictTreeRoot).then((res) => {
        allConflictTreeViewProvider.refresh()
      })
    })
  )

  let codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
    '*',
    new ConflictLensProvider()
  )
  // push the command and CodeLens provider to the context so it can be disposed of later
  context.subscriptions.push(codeLensProviderDisposable)

  // feature2: recommend the next (related or similar) conflict to resolve
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'somanyconflicts.next',
      async (...args: any[]) => {
        let conflict: Conflict | null

        // If launched with known context, take the conflict from that
        if (args[0] === 'current-conflict') {
          conflict = args[1]
        } else {
          // Attempt to find a conflict that matches the current cursor position
          conflict = SoManyConflicts.findConflictContainingSelection(
            vscode.window.activeTextEditor
          )
        }

        if (!conflict) {
          vscode.window.showWarningMessage(
            'Editor cursor is not within any merge conflict!'
          )
          return
        }

        if (!isReady()) {
          await init()
        }
        // locate the focusing conflict and start from it
        SoManyConflicts.suggestNextConflict(
          allConflictSections,
          conflict,
          graph
        )
      }
    )
  )

  // feature3: recommend resolution strategy given conflict resolved before
  context.subscriptions.push(
    vscode.commands.registerCommand('somanyconflicts.resolve', async () => {
      if (!isReady()) {
        await init()
      }
      // TODO: record resolution strategy of conflicts

      // locate the focusing conflict and start from it
      // query previously resolved related conflicts
      // suggest resolution strategy accordingly
      SoManyConflicts.suggestResolutionStrategy(allConflictSections, graph)
    })
  )

  // check if the workspace is readily prepared
  function isReady(): boolean {
    return allConflictSections.length != 0 && graph && graph !== undefined
  }

  async function init(): Promise<any> {
    let message: string = ''
    // let allConflictSections: ISection[] = []
    if (vscode.workspace.workspaceFolders !== undefined) {
      let workspace = vscode.workspace.workspaceFolders[0].uri.path
      // let currentFile = vscode.workspace.workspaceFolders[0].uri.fsPath ;

      return vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Scanning so many conflicts in your workspace...',
          cancellable: true,
        },
        async (progress, token) => {
          token.onCancellationRequested(() => {
            console.log('User canceled the scanning.')
          })

          // progress.report({ increment: 0 })

          // setTimeout(() => {
          //   progress.report({ increment: 10 })
          // }, 1000)

          allConflictSections = await SoManyConflicts.scanAllConflicts(
            workspace
          )
          if (allConflictSections.length == 0) {
            message = 'Found no merge conflicts in the opened workspace!'
            vscode.window.showWarningMessage(message)
            return
          } else {
            // construct a graph to keep relations of conflicts
            graph = SoManyConflicts.constructGraph(allConflictSections)
            if (graph == undefined) {
              message = 'Failed to construct the graph for conflicts.'
              vscode.window.showErrorMessage(message)
              return
            }
          }
          message =
            'Found ' +
            allConflictSections.length +
            ' conflicts in total for the current workspace.'
          vscode.window.showInformationMessage(message)
          progress.report({ increment: 100 })
        }
      )
    } else {
      message = 'Please open a workspace with merge conflicts first.'
      vscode.window.showWarningMessage(message)
      return
    }
    // return allConflictSections
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}

function addSubcommandOpenFile(context: vscode.ExtensionContext) {
  const commandsToOpenFiles = 'somanyconflicts.openFileAt'
  const openFileHandler = async function (
    uri: vscode.Uri,
    range: vscode.Range
  ) {
    await vscode.commands.executeCommand('vscode.open', uri).then((x) => {
      let activeEditor = vscode.window.activeTextEditor
      if (activeEditor) {
        activeEditor.revealRange(range, vscode.TextEditorRevealType.InCenter)
        activeEditor.selection = new vscode.Selection(range.start, range.start)
      }
    })
  }
  context.subscriptions.push(
    vscode.commands.registerCommand(commandsToOpenFiles, openFileHandler)
  )
}

function createTree(viewName: string): [ConflictTreeItem[], ConflictTreeViewProvider] {
  let treeRoot: ConflictTreeItem[] = []
  const treeViewProvider = new ConflictTreeViewProvider(
    treeRoot
  )
  vscode.window.registerTreeDataProvider(
    viewName,
    treeViewProvider
  )
  return [treeRoot, treeViewProvider]
}
