'use strict'

import { AlgUtils } from './AlgUtils'
import { Conflict } from './Conflict'
import { ISection } from './ISection'
import { Strategy } from './Strategy'
import { Range } from 'vscode'

export class ConflictSection implements ISection {
  private _conflict: Conflict
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

  private _stragegy: Strategy = Strategy.Unknown
  public get stragegy(): Strategy {
    return this._stragegy
  }
  public set stragegy(value: Strategy) {
    this._stragegy = value
  }

  private linesToText(lines: string[]): string[] {
    if (lines.length > 0) {
      return [lines.reduce((pre, cur) => { return pre + cur })]
    } else {
      return ['']
    }
  }

  public checkStrategy(newText: string) {
    // compare the new text with each side and combination to check the strategy (trimmed line by line)
    let lines: string[] = newText.split(/\r\n|\r|\n/)
    lines = lines.filter((line) => line.trim().length > 0)
    if (lines.length == 0) {
      this._hasResolved = true
      this._strategiesProb[5] = 1.0
      this._stragegy = Strategy.AcceptNone
      return
    }
    let similarities: number[] = []

    let ourText: string[] = this.linesToText(this.conflict.ours.lines)
    let theirText: string[], baseText: string[]

    let simi = AlgUtils.compareLineByLine([newText], ourText)
    if (simi == 1.0) {
      this._resolvedCode = newText
      this._hasResolved = true
      this._strategiesProb[1] = 1.0
      this._stragegy = Strategy.AcceptOurs
      return
    } else {
      similarities.push(simi)
      theirText = this.linesToText(this.conflict.theirs.lines)
      simi = AlgUtils.compareLineByLine([newText], theirText)
      if (simi == 1.0) {
        this._resolvedCode = newText
        this._hasResolved = true
        this._strategiesProb[2] = 1.0
        this._stragegy = Strategy.AcceptTheirs
        return
      } else {
        similarities.push(simi)
        baseText = this.linesToText(this.conflict.base.lines)
        simi = AlgUtils.compareLineByLine([newText], baseText)
        if (simi == 1.0) {
          this._resolvedCode = newText
          this._hasResolved = true
          this._strategiesProb[3] = 1.0
          this._stragegy = Strategy.AcceptBase
          return
        } else {
          similarities.push(simi)
          let bothText: string[] = [ourText[0] + theirText[0]]
          simi = AlgUtils.compareLineByLine([newText], bothText)
          if (simi == 1.0) {
            this._resolvedCode = newText
            this._hasResolved = true
            this._strategiesProb[4] = 1.0
            this._stragegy = Strategy.AcceptBoth
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
    this._hasResolved = true
  }

  public updateStrategy(probs: Array<number>, weight: number): Array<number> {
    // avg (prob*weight) + self.prob
    let newProbs = probs.map((p) => p * weight)
    for (let i in newProbs) {
      this._strategiesProb[i] += newProbs[i]
    }
    let sum = this._strategiesProb.reduce((a, b) => a + b, 0)

    if (sum != 0) {
      for (let i in this._strategiesProb) {
        this._strategiesProb[i] = +(this._strategiesProb[i] / sum).toFixed(4)
      }
    }

    return this._strategiesProb
  }

  public getText(): string {
    return this._conflict.getSqueezedText()
  }

  public printLineRange(): string {
    return '(' + (this._conflict.range.start.line + 1) + '-' + (this._conflict.range.end.line + 1) + ')'
  }

  public updateRange(range: Range) {
    this._conflict.range = range
    this._conflict.computeRanges(range.start.line, range.end.line)
  }
}
