// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
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

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  // feature1: topo-sort for the optimal order to resolve conflicts
  context.subscriptions.push(
    vscode.commands.registerCommand('somanyconflicts.somany', async () => {
      if (!isReady()) {
        await init()
      }
      if (!isReady()) {
        message = 'Something goes wrong.'
        vscode.window.showErrorMessage(message)
        return
      }
      message = `Finding the starting point to resolve conflicts...`
      vscode.window.showInformationMessage(message)
      SoManyConflicts.suggestStartingPoint(allConflictSections, graph)
    })
  )

  // feature2: recommend the next (related or similar) conflict to resolve
  context.subscriptions.push(
    vscode.commands.registerCommand('somanyconflicts.next', async () => {
      if (!isReady()) {
        await init()
      }
      // locate the focusing conflict and start from it
      SoManyConflicts.suggestNextConflict(allConflictSections, graph)
    })
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

  async function init(): Promise<void> {
    let message: string = ''
    // let allConflictSections: ISection[] = []
    if (vscode.workspace.workspaceFolders !== undefined) {
      let workspace = vscode.workspace.workspaceFolders[0].uri.path
      // let currentFile = vscode.workspace.workspaceFolders[0].uri.fsPath ;

      message = `Scanning so many conflicts in your workspace...`
      vscode.window.showInformationMessage(message)

      allConflictSections = await SoManyConflicts.scanAllConflicts(workspace)
      if (allConflictSections.length == 0) {
        message = 'Found no merge conflicts in the opened workspace.'
        vscode.window.showErrorMessage(message)
        return
      } else {
        // construct a graph to keep relations of conflicts
        graph = SoManyConflicts.constructGraph(allConflictSections)
        if (graph == undefined) {
          message = 'Failed to construct graph for the opened workspace.'
          vscode.window.showErrorMessage(message)
          return
        }
      }
    } else {
      message = 'Please open a workspace with merge conflicts first.'
      vscode.window.showErrorMessage(message)
      return
    }
    // return allConflictSections
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
