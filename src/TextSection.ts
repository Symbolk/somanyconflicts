'use strict'

import { ISection } from './ISection'

export class TextSection implements ISection {
  private readonly lines: string[] = []

  public constructor(lines: string[]) {
    this.lines = lines
  }

  public getText(): string {
    return this.lines.join('')
  }
}
