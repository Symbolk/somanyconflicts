// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { SoManyConflicts } from './SoManyConflicts'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "somanyconflicts" is now active!'
  )

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    'somanyconflicts.somany',
    () => {
      let message: string
      if (vscode.workspace.workspaceFolders !== undefined) {
        let workspace = vscode.workspace.workspaceFolders[0].uri.path
        // let currentFile = vscode.workspace.workspaceFolders[0].uri.fsPath ;

        message = `So Many Conflicts: Workspace: ${workspace}`

        vscode.window.showInformationMessage(message)

        SoManyConflicts.scanAllConflicts(workspace)

        // feature1: topo-sort for the optimal order to resolve conflicts
        // feature2: recommend the next (related or similar) conflict to resolve
        // feature3: recommend resolution strategy given conflict resolved before
		
      } else {
        message = 'So Many Conflicts: Please open a working folder first.'

        vscode.window.showErrorMessage(message)
      }
    }
  )

  context.subscriptions.push(disposable)
}

// this method is called when your extension is deactivated
export function deactivate() {}
