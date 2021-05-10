import simpleGit, { SimpleGit, StatusResult } from 'simple-git'

export class SoManyConflicts {
  public static scanAllConflicts(path: string): void {
    // get all files in conflict state in the opened workspace
    // case1: git repo
    let filePaths: string[]
    SoManyConflicts.getConflictingFiles(path)
      .then((res) => {
        if (res) {
          console.log(res)
        }
      })
      .catch((err) => {
        console.log(err)
      })

    // scan and parse all conflict blocks
    // build partial order between conflicts (identifier or LSP)
    // must consider the conflict blocks and also the context of it to work better
    // feature1: topo-sort for the optimal order to resolve conflicts
    // feature2: recommend the next (related or similar) conflict to resolve
    // feature3: recommend resolution strategy given conflict resolved before
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
