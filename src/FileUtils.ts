import simpleGit, {
  CheckRepoActions,
  SimpleGit,
} from 'simple-git'
import {
  readdirSync,
  readFileSync,
  statSync,
  promises as fs,
} from 'fs'
import path = require('path')
import { Constants } from './Constants'
import { Language } from './Language'

export class FileUtils {
  public static detectLanguage(path: string): Language {
    const extension: string | undefined = path.split('.').pop()
    switch (extension) {
      case undefined:
        return 'Unknown'
      case 'java':
        return 'Java'
      case 'js':
        return 'JavaScript'
      case 'ts':
      // case 'tsx':
        return 'TypeScript'
      case 'py':
        return 'Python'
      default:
        return 'Unknown'
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
    directory: string,
  ): Promise<string[]> {
    const git: SimpleGit = simpleGit(directory)
    const res = await git.checkIsRepo(CheckRepoActions.IS_REPO_ROOT)
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
              const filePaths: string[] = result.split(/\r\n|\r|\n/)
              resolve(
                filePaths
                  .filter((s) => s.length > 0)
                  .map((filePath) => path.join(directory, filePath)),
              )
            }
          },
        )
      })
    } else {
      // case2: a normal folder
      console.log('Working under a normal directory: ' + directory)
      const conflictingFilePaths: string[] = []
      // filter conflicting files
      // let filePaths: string[] = await this.listFilePaths(directory)
      const filePaths: string[] = this.listFilePathsSync(directory)
      for (const filePath of filePaths) {
        const content = this.readFileContent(filePath)
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

  public static getFileNameFromPath(filePath: string): string {
    return path.basename(filePath)
  }
}
