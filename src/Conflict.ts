'use strict'

import { Uri } from 'vscode'
import { Position, Range } from 'vscode'
import { ConflictSide } from './ConflictSide'
import { Constants } from './Constants'
import { Symbol } from './Symbol'

export class Conflict {
  public uri: Uri | undefined = undefined
  public hasBase: boolean = false

  private textAfterMarkerOurs: string | undefined = undefined
  private textAfterMarkerBase: string | undefined = undefined
  private textAfterMarkerTheirs: string | undefined = undefined
  private textAfterMarkerEnd: string | undefined = undefined

  public range: Range = new Range(new Position(0, 0), new Position(0, 0))
  private _ours: ConflictSide = new ConflictSide()
  public get ours(): ConflictSide {
    return this._ours
  }

  private _base: ConflictSide = new ConflictSide()
  public get base(): ConflictSide {
    return this._base
  }

  private _theirs: ConflictSide = new ConflictSide()
  public get theirs(): ConflictSide {
    return this._theirs
  }

  public getSqueezedText(): string {
    const minNumberOfLines: number = Math.min(
      this._ours.lines.length,
      this._theirs.lines.length
    )
    const maxNumberOfLines: number = Math.max(
      this._ours.lines.length,
      this._theirs.lines.length
    )

    // Top cursor will contain the number of identical lines from the top.
    // Bottom cursor will contain the number of identical lines from the bottom.
    let topCursor: number = 0
    let bottomCursor: number = 0

    while (topCursor < minNumberOfLines) {
      const ourLine: string = this._ours.lines[topCursor]
      const theirLine: string = this._theirs.lines[topCursor]

      if (ourLine === theirLine) {
        topCursor++
      } else {
        break
      }
    }

    // We need to subtract topCursor, to ensure that topCursor + bottomCursor <= minNumberOfLines
    while (bottomCursor < minNumberOfLines - topCursor) {
      const ourLine: string =
        this._ours.lines[this._ours.lines.length - 1 - bottomCursor]
      const theirLine: string =
        this._theirs.lines[this._theirs.lines.length - 1 - bottomCursor]

      if (ourLine === theirLine) {
        bottomCursor++
      } else {
        break
      }
    }

    const identicalTopLines: string[] = this._ours.lines.slice(0, topCursor)

    const identicalBottomLines: string[] = this._ours.lines.slice(
      this._ours.lines.length - bottomCursor,
      this._ours.lines.length
    )

    let parts: string[]

    if (topCursor + bottomCursor === maxNumberOfLines) {
      parts = [...identicalTopLines, ...identicalBottomLines]
    } else {
      const ourNonIdenticalLines: string[] = this._ours.lines.slice(
        topCursor,
        this._ours.lines.length - bottomCursor
      )

      const theirNonIdenticalLines: string[] = this._theirs.lines.slice(
        topCursor,
        this._theirs.lines.length - bottomCursor
      )

      let baseParts: string[]

      if (this.hasBase) {
        baseParts = [
          Constants.conflictMarkerBase + this.textAfterMarkerBase,
          ...this._base.lines,
        ]
      } else {
        baseParts = []
      }

      parts = [
        ...identicalTopLines,
        Constants.conflictMarkerOurs + this.textAfterMarkerOurs,
        ...ourNonIdenticalLines,
        ...baseParts,
        Constants.conflictMarkerTheirs + this.textAfterMarkerTheirs,
        ...theirNonIdenticalLines,
        Constants.conflictMarkerEnd + this.textAfterMarkerEnd,
        ...identicalBottomLines,
      ]
    }

    return parts.filter((part) => part.length > 0).join('')
  }

  public addBaseLine(line: string): void {
    this._base.lines.push(line)
  }

  public addOurLine(line: string): void {
    this._ours.lines.push(line)
  }

  public addTheirLine(line: string): void {
    this._theirs.lines.push(line)
  }

  public setTextAfterMarkerEnd(text: string): void {
    this.textAfterMarkerEnd = text
  }

  public setTextAfterMarkerBase(text: string): void {
    this.textAfterMarkerBase = text
  }

  public setTextAfterMarkerOurs(text: string): void {
    this.textAfterMarkerOurs = text
  }

  public setTextAfterMarkerTheirs(text: string): void {
    this.textAfterMarkerTheirs = text
  }

  public addOurIdentifier(identifier: Symbol): void {
    this._ours.symbols.push(identifier)
  }

  public addBaseIdentifier(identifier: Symbol): void {
    this._base.symbols.push(identifier)
  }

  public addTheirIdentifier(identifier: Symbol): void {
    this._theirs.symbols.push(identifier)
  }

  public computeRanges(startLine: number, endLine: number) {
    // line numbers start from 0, and do not include conflict markers
    let oursEndLine = startLine + 1 + this._ours.lines.length - 1
    this._ours.range = new Range(
      new Position(startLine + 1, 0),
      new Position(
        oursEndLine,
        this._ours.lines.length > 0
          ? this._ours.lines[this._ours.lines.length - 1].length - 1
          : 0
      )
    )
    if (this.hasBase) {
      let orgEndLine = oursEndLine + 1 + this._base.lines.length
      this._base.range = new Range(
        new Position(oursEndLine + 2, 0),
        new Position(
          orgEndLine,
          this._base.lines.length > 0
            ? this._base.lines[this._base.lines.length - 1].length - 1
            : 0
        )
      )
      this._theirs.range = new Range(
        new Position(orgEndLine + 2, 0),
        new Position(
          endLine - 1,
          this._theirs.lines.length > 0
            ? this._theirs.lines[this._theirs.lines.length - 1].length - 1
            : 0
        )
      )
    } else {
      this._theirs.range = new Range(
        new Position(oursEndLine + 2, 0),
        new Position(
          endLine - 1,
          this._theirs.lines.length > 0
            ? this._theirs.lines[this._theirs.lines.length - 1].length - 1
            : 0
        )
      )
    }

    this.range = new Range(
      new Position(startLine, 0),
      new Position(
        endLine,
        Constants.conflictMarkerEnd.length +
          (this.textAfterMarkerEnd === undefined
            ? 0
            : this.textAfterMarkerEnd.length)
      )
    )
  }
}
