import * as vscode from 'vscode'
import simpleGit, { SimpleGit, StatusResult } from 'simple-git'
import { readFileSync } from 'fs'
import { Parser } from './Parser'
import { ISection } from './ISection'

export class SoManyConflicts {
  public static scanAllConflicts(workspace: string): void {
    let message: string = ''
    // get all files in conflict state in the opened workspace
    // case1: git repo
    let filePaths: string[]
    SoManyConflicts.getConflictingFiles(workspace)
      .then((res) => {
        if (res) {
          for (const path of res) {
            // scan and parse all conflict blocks
            let content = readFileSync(workspace + '/' + path, 'utf-8')
            const sections: ISection[] = Parser.parse(content)
            console.log()
          }
          // build partial order between conflicts (identifier or LSP)
          // must consider the conflict blocks and also the context of it to work better


        }
      })
      .catch((err) => {
        vscode.window.showInformationMessage(err)
      })
  }

  // private static parseConflicts(): {}

  public static getConflictingFiles(path: string): Promise<string[]> {
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
