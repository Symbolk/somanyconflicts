'use strict'

import { AlgUtils } from './AlgUtils'
import { Conflict } from './Conflict'
import { ISection } from './ISection'
import { Strategy } from './Strategy'

export class ConflictSection implements ISection {
  // readonly data stored in conflict itself
  private readonly _conflict: Conflict
  // mutable data stored in conflict section
  private hasResolved: boolean = false
  // code string after resolution
  private resolvedCode: string = ''
  // update interactively as conflicts are resolved
  private strategiesProb: Array<number> = new Array<number>(6).fill(0)

  public checkStrategy(newText: string) {
    // compare the new text with each side and combination to check the strategy (trimmed line by line)
    let lines: string[] = newText.split(/\r\n|\r|\n/)
    lines = lines.filter((line) => line.trim().length > 0)
    if(lines.length == 0) {
      this.strategiesProb[4] = 1.0
      return
    }
    let similarities: number[] = []

    let simi = AlgUtils.compareLineByLine(lines, this.conflict.ours.lines)
    if (simi == 1.0) {
      this.resolvedCode = newText
      this.hasResolved = true
      this.strategiesProb[0] = 1.0
      return
    } else {
      similarities.push(simi)
      simi = AlgUtils.compareLineByLine(lines, this.conflict.theirs.lines)
      if (simi == 1.0) {
        this.resolvedCode = newText
        this.hasResolved = true
        this.strategiesProb[1] = 1.0
        return
      } else {
        similarities.push(simi)
        simi = AlgUtils.compareLineByLine(lines, this.conflict.base.lines)
        if (simi == 1.0) {
          this.resolvedCode = newText
          this.hasResolved = true
          this.strategiesProb[2] = 1.0
          return
        } else {
          similarities.push(simi)
          simi = AlgUtils.compareLineByLine(lines, [...this.conflict.ours.lines, ...this.conflict.theirs.lines])
          if (simi == 1.0) {
            this.resolvedCode = newText
            this.hasResolved = true
            this.strategiesProb[3] = 1.0
            return
          } else {
            similarities.push(simi)
          }
        }
      }
    }
    // if none match, save similarities
    let i = 0
    for (let sim of similarities) {
      this.strategiesProb[i] = sim
      i += 1
    }
  }

  public constructor(conflict: Conflict) {
    this._conflict = conflict
  }

  public get conflict(): Conflict {
    return this._conflict
  }

  public getText(): string {
    return this._conflict.getSqueezedText()
  }
}
