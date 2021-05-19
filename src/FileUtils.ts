import simpleGit, { SimpleGit, StatusResult } from 'simple-git'
import { readFileSync } from 'fs'

export class FileUtils {
  public static readFileContent(absPath: string): string {
    return readFileSync(absPath, 'utf-8')
  }

  public static async getConflictingFiles(path: string): Promise<string[]> {
    // case1: git repo (if contains .git)
    const git: SimpleGit = simpleGit(path)
    // git.checkIsRepo()
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
    // TODO: case2: a normal folder
  }
}
