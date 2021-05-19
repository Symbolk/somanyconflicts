// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { ISection } from './ISection'
import { SoManyConflicts } from './SoManyConflicts'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "somanyconflicts" is now active!'
  )

  // raw conflict blocks
  let allConflictSections: ISection[] = []
  // ordered conflicts blocks in a Adjacency List form graph

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  // feature1: topo-sort for the optimal order to resolve conflicts
  context.subscriptions.push(
    vscode.commands.registerCommand('somanyconflicts.somany', async () => {
      if (allConflictSections.length == 0) {
        await init()
      }
      // construct topo order of all conflict blocks
      SoManyConflicts.constructGraph(allConflictSections)
    })
  )

  // feature2: recommend the next (related or similar) conflict to resolve
  context.subscriptions.push(
    vscode.commands.registerCommand('somanyconflicts.next', async () => {
      if (allConflictSections.length == 0) {
        await init()
      }
      // locate the focusing conflict and start from it
    })
  )

  // feature3: recommend resolution strategy given conflict resolved before
  context.subscriptions.push(
    vscode.commands.registerCommand('somanyconflicts.resolve', async () => {
      if (allConflictSections.length == 0) {
        awaitinit()
      }
      // locate the focusing conflict and start from it
      // record previously resolution strategy of related conflicts
      // suggest resolution strategy accordingly
    })
  )
}

async function init(): Promise<ISection[]> {
  let message: string = ''
  let allConflictSections: ISection[] = []
  if (vscode.workspace.workspaceFolders !== undefined) {
    let workspace = vscode.workspace.workspaceFolders[0].uri.path
    // let currentFile = vscode.workspace.workspaceFolders[0].uri.fsPath ;

    message = `Finding the starting point to resolve so many conflict blocks...`

    vscode.window.showInformationMessage(message)

    allConflictSections = await SoManyConflicts.scanAllConflicts(workspace)

    // construct topo order of all conflict blocks by symbols

    // application

    // feature1: topo-sort for the optimal order to resolve conflicts
    // feature2: recommend the next (related or similar) conflict to resolve
    // feature3: recommend resolution strategy given conflict resolved before
  } else {
    message = 'So Many Conflicts: Please open a working folder first.'

    vscode.window.showErrorMessage(message)
  }
  return allConflictSections
}

// this method is called when your extension is deactivated
export function deactivate() {}
