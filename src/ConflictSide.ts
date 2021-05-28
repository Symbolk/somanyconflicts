'use strict'

import { Symbol } from './Symbol'
import { Range, Position } from 'vscode'
import { Identifier } from './Identifier'
export class ConflictSide {
  private _lines: string[]
  private _range: Range
  private _symbols: Symbol[]
  private _identifiers: Identifier[]

  public constructor() {
    this._lines = []
    this._range = new Range(new Position(0, 0), new Position(0, 0))
    this._symbols = []
    this._identifiers = []
  }

  public get lines(): string[] {
    return this._lines
  }

  public set lines(value: string[]) {
    this._lines = value
  }

  public get range(): Range {
    return this._range
  }

  public set range(value: Range) {
    this._range = value
  }

  public get symbols(): Symbol[] {
    return this._symbols
  }

  public get identifiers(): Identifier[] {
    return this._identifiers
  }
  public set identifiers(value: Identifier[]) {
    this._identifiers = value
  }
}
