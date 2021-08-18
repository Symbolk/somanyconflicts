import * as vscode from 'vscode'
import { ConflictSection } from './ConflictSection'
import { Parser } from './Parser'

export class ConflictLensProvider implements vscode.CodeLensProvider {
  public provideCodeLenses(
    document: vscode.TextDocument,

    token: vscode.CancellationToken,
  ): vscode.CodeLens[] | Promise<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = []
    const conflictSections: ConflictSection[] = Parser.parse(document.uri, document.getText()).filter(
      (sec) => sec instanceof ConflictSection,
    ) as ConflictSection[]
    const conflictsCount = conflictSections?.length ?? 0

    if (!conflictsCount) {
      return []
    }

    // generate code lens for all conflict sections
    conflictSections.forEach((conflictSection) => {
      const nextCommand: vscode.Command = {
        command: 'somanyconflicts.next',
        title: 'Show Related Conflicts',
        arguments: ['current-conflict', conflictSection.conflict],
      }
      const range: vscode.Range = conflictSection.conflict.range
      codeLenses.push(new vscode.CodeLens(range, nextCommand))

      const strategyCommand: vscode.Command = {
        command: 'somanyconflicts.how',
        title: 'Recommend Resolution Strategy',
        arguments: ['current-conflict', conflictSection.conflict],
      }

      codeLenses.push(new vscode.CodeLens(range, strategyCommand))
      // codeLenses.push(
      //   new CodeLens(
      //     range.with(
      //       range.start.with({ character: range.start.character + 1 })
      //     ),
      //     strategyCommand
      //   )
      // )
    })

    return codeLenses
  }

  public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
    console.log('Resolved codelens')

    codeLens.command = {
      title: 'Show Related Conflicts',
      tooltip: 'Relevant conflict blocks suggested by SoManyConflicts',
      command: 'somanyconflicts.test',
      arguments: ['Argument 1', false],
    }
    return codeLens
  }
}
