import simpleGit, {
  CheckRepoActions,
  SimpleGit,
  StatusResult,
} from 'simple-git'
import {
  readdirSync,
  readFile,
  readFileSync,
  statSync,
  promises as fs,
} from 'fs'
import path = require('path')
import util = require('util')
import { Constants } from './Constants'
import { Language } from './Language'

export class FileUtils {
  public static detectLanguage(path: string): Language {
    let extension: string | undefined = path.split('.').pop()
    switch (extension) {
      case undefined:
        return Language.Other
      case 'java':
        return Language.Java
      case 'js':
        return Language.JavaScript
      case 'ts':
      // case 'tsx':
        return Language.TypeScript
      case 'py':
        return Language.Python
      default:
        return Language.Other
    }
  }

  public static readFileContent(absPath: string): string {
    return readFileSync(absPath, 'utf-8')
  }

  /**
   * Get the absolute path of conflicting files
   * @param directory 
   * @returns 
   */
  public static async getConflictingFilePaths(
    directory: string
  ): Promise<string[]> {
    const git: SimpleGit = simpleGit(directory)
    let res = await git.checkIsRepo(CheckRepoActions.IS_REPO_ROOT)
    if (res) {
      // check conflicting status also?
      // const status: StatusResult = await git.status();
      console.log('Working under a git repo: ' + directory)
      // case1: git repo (contains .git)
      return new Promise((resolve, reject) => {
        git.diff(
          ['--name-only', '--diff-filter=U'],
          (err: any | null, result?: any) => {
            if (err) {
              reject(err)
            } else {
              let filePaths: string[] = result.split(/\r\n|\r|\n/)
              resolve(
                filePaths
                  .filter((s) => s.length > 0)
                  .map((filePath) => path.join(directory, filePath))
              )
            }
          }
        )
      })
    } else {
      // case2: a normal folder
      console.log('Working under a normal directory: ' + directory)
      let conflictingFilePaths: string[] = []
      // filter conflicting files
      // let filePaths: string[] = await this.listFilePaths(directory)
      let filePaths: string[] = this.listFilePathsSync(directory)
      for (let filePath of filePaths) {
        let content = this.readFileContent(filePath)
        if (content.includes(Constants.conflictMarkerOurs)) {
          conflictingFilePaths.push(filePath)
        }
      }
      return conflictingFilePaths
    }
  }

  private static listFilePathsSync(directory: string): string[] {
    let fileList: string[] = []

    const files = readdirSync(directory)
    for (const file of files) {
      if (file.startsWith('.')) {
        continue
      }
      const absPath = path.join(directory, file)
      if (statSync(absPath).isDirectory()) {
        fileList = [...fileList, ...this.listFilePathsSync(absPath)]
      } else {
        fileList.push(absPath)
      }
    }
    return fileList
  }

  private static async listFilePaths(directory: string) {
    let fileList: string[] = []

    const files = await fs.readdir(directory)
    for (const file of files) {
      if (file.startsWith('.')) {
        continue
      }
      const absPath = path.join(directory, file)
      if ((await fs.stat(absPath)).isDirectory()) {
        fileList = [...fileList, ...(await this.listFilePaths(absPath))]
      } else {
        fileList.push(absPath)
      }
    }

    return fileList
  }
}
