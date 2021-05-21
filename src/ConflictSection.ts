'use strict'

import { Conflict } from './Conflict'
import { ISection } from './ISection'
import { Strategy } from './Strategy'

export class ConflictSection implements ISection {
  private readonly _conflict: Conflict
  private _strategy: Strategy = Strategy.Unknown

  public get strategy(): Strategy {
    return this._strategy
  }
  public set strategy(value: Strategy) {
    this._strategy = value
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
