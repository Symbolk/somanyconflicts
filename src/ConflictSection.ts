'use strict'

import { AlgUtils } from './AlgUtils'
import { Conflict } from './Conflict'
import { ISection } from './ISection'
import { Strategy } from './Strategy'

export class ConflictSection implements ISection {
  // readonly data stored in conflict itself
  private readonly _conflict: Conflict
  private _index: string = ''
  public get index(): string {
    return this._index
  }
  public set index(value: string) {
    this._index = value
  }
  public get conflict(): Conflict {
    return this._conflict
  }

  public constructor(conflict: Conflict) {
    this._conflict = conflict
  }

  // mutable data stored in conflict section
  // has resolved by developer
  private _hasResolved: boolean = false
  public get hasResolved(): boolean {
    return this._hasResolved
  }
  public set hasResolved(value: boolean) {
    this._hasResolved = value
  }
  // code string after resolution
  private _resolvedCode: string = ''
  public get resolvedCode(): string {
    return this._resolvedCode
  }
  public set resolvedCode(value: string) {
    this._resolvedCode = value
  }
  // update interactively as conflicts are resolved
  private _strategiesProb: Array<number> = new Array<number>(6).fill(0)
  public get strategiesProb(): Array<number> {
    return this._strategiesProb
  }
  public set strategiesProb(value: Array<number>) {
    this._strategiesProb = value
  }

  public checkStrategy(newText: string) {
    // compare the new text with each side and combination to check the strategy (trimmed line by line)
    let lines: string[] = newText.split(/\r\n|\r|\n/)
    lines = lines.filter((line) => line.trim().length > 0)
    if (lines.length == 0) {
      this._strategiesProb[4] = 1.0
      return
    }
    let similarities: number[] = []

    let simi = AlgUtils.compareLineByLine(lines, this.conflict.ours.lines)
    if (simi == 1.0) {
      this._resolvedCode = newText
      this._hasResolved = true
      this._strategiesProb[0] = 1.0
      return
    } else {
      similarities.push(simi)
      simi = AlgUtils.compareLineByLine(lines, this.conflict.theirs.lines)
      if (simi == 1.0) {
        this._resolvedCode = newText
        this._hasResolved = true
        this._strategiesProb[1] = 1.0
        return
      } else {
        similarities.push(simi)
        simi = AlgUtils.compareLineByLine(lines, this.conflict.base.lines)
        if (simi == 1.0) {
          this._resolvedCode = newText
          this._hasResolved = true
          this._strategiesProb[2] = 1.0
          return
        } else {
          similarities.push(simi)
          simi = AlgUtils.compareLineByLine(lines, [...this.conflict.ours.lines, ...this.conflict.theirs.lines])
          if (simi == 1.0) {
            this._resolvedCode = newText
            this._hasResolved = true
            this._strategiesProb[3] = 1.0
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
      this._strategiesProb[i] = sim
      i += 1
    }
  }

  
  public getText(): string {
    return this._conflict.getSqueezedText()
  }
 
}
