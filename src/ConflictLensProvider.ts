import {
  CodeLensProvider,
  TextDocument,
  CodeLens,
  CancellationToken,
  Range,
  Position,
  Command,
  workspace,
} from 'vscode'
import { ConflictSection } from './ConflictSection'
import { Parser } from './Parser'

export class ConflictLensProvider implements CodeLensProvider {
  public provideCodeLenses(
    document: TextDocument,
    token: CancellationToken
  ): CodeLens[] | Thenable<CodeLens[]> {
    let codeLenses: CodeLens[] = []
    let conflictSections: ConflictSection[] = Parser.parse(
      document.uri,
      document.getText()
    ).filter((sec) => sec instanceof ConflictSection) as ConflictSection[]
    const conflictsCount = conflictSections?.length ?? 0

    if (!conflictsCount) {
      return []
    }

    // generate code lens for all conflict sections
    conflictSections.forEach((conflictSection) => {
      let nextCommand: Command = {
        command: 'somanyconflicts.next',
        title: 'Show Related Conflicts',
        arguments: ['current-conflict', conflictSection.conflict],
      }
      let strategyCommand: Command = {
        command: 'somanyconflicts.how',
        title: 'Recommend Resolution',
        arguments: ['current-conflict', conflictSection.conflict],
      }

      let range: Range = conflictSection.conflict.range
      codeLenses.push(new CodeLens(range, nextCommand))
      codeLenses.push(new CodeLens(range, strategyCommand))
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

  public resolveCodeLens(codeLens: CodeLens, token: CancellationToken) {
    codeLens.command = {
      title: 'Show Related Conflicts',
      tooltip: 'Relevant conflict blocks suggested by SoManyConflicts',
      command: 'somanyconflicts.next',
      arguments: ['Argument 1', false],
    }
    return codeLens
  }
}
