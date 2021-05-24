import simpleGit, {
  CheckRepoActions,
  SimpleGit,
  StatusResult,
} from 'simple-git'
import { readdir, readdirSync, readFileSync, stat, statSync } from 'fs'
import path = require('path')
import util = require('util')
const readdirPromise = util.promisify(readdir)
const statPromise = util.promisify(stat)

export class FileUtils {
  public static readFileContent(absPath: string): string {
    return readFileSync(absPath, 'utf-8')
  }

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

      // just return all files' relative paths under the folder or filter conflicting ones first?
      // let filePaths: string[] = await this.listFilePaths(directory)
      let filePaths: string[] = this.listFilePathsSync(directory)
      return filePaths
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

    const files = await readdirPromise(directory)
    for (const file of files) {
      if (file.startsWith('.')) {
        continue
      }
      const absPath = path.join(directory, file)
      if ((await statPromise(absPath)).isDirectory()) {
        fileList = [...fileList, ...(await this.listFilePaths(absPath))]
      } else {
        fileList.push(absPath)
      }
    }

    return fileList
  }
}
