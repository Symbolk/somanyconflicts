'use strict'

import { ISection } from './ISection'

export class TextSection implements ISection {
  private readonly _lines: string[] = []

  public get lines(): string[] {
    return this._lines
  }

  public constructor(lines: string[]) {
    this._lines = lines
  }

  public getText(): string {
    return this._lines.join('')
  }
}
