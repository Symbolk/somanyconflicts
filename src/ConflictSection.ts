'use strict'

import { Conflict } from './Conflict'
import { ISection } from './ISection'

export class ConflictSection implements ISection {
  private readonly conflict: Conflict

  public constructor(conflict: Conflict) {
    this.conflict = conflict
  }

  public getText(): string {
    return this.conflict.getSqueezedText()
  }
}
