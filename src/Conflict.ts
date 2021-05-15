'use strict'
import { Position, Range } from 'vscode'
import { Constants } from './Constants'

export class Conflict {
  public hasOriginal: boolean = false

  private textAfterMarkerOurs: string | undefined = undefined
  private textAfterMarkerOriginal: string | undefined = undefined
  private textAfterMarkerTheirs: string | undefined = undefined
  private textAfterMarkerEnd: string | undefined = undefined

  private ourLines: string[] = []
  private originalLines: string[] = []
  private theirLines: string[] = []
  public ourRange: Range = new Range(new Position(0, 0), new Position(0, 0))
  public originalRange: Range = new Range(
    new Position(0, 0),
    new Position(0, 0)
  )
  public theirRange: Range = new Range(new Position(0, 0), new Position(0, 0))

  public getSqueezedText(): string {
    const minNumberOfLines: number = Math.min(
      this.ourLines.length,
      this.theirLines.length
    )
    const maxNumberOfLines: number = Math.max(
      this.ourLines.length,
      this.theirLines.length
    )

    // Top cursor will contain the number of identical lines from the top.
    // Bottom cursor will contain the number of identical lines from the bottom.
    let topCursor: number = 0
    let bottomCursor: number = 0

    while (topCursor < minNumberOfLines) {
      const ourLine: string = this.ourLines[topCursor]
      const theirLine: string = this.theirLines[topCursor]

      if (ourLine === theirLine) {
        topCursor++
      } else {
        break
      }
    }

    // We need to subtract topCursor, to ensure that topCursor + bottomCursor <= minNumberOfLines
    while (bottomCursor < minNumberOfLines - topCursor) {
      const ourLine: string =
        this.ourLines[this.ourLines.length - 1 - bottomCursor]
      const theirLine: string =
        this.theirLines[this.theirLines.length - 1 - bottomCursor]

      if (ourLine === theirLine) {
        bottomCursor++
      } else {
        break
      }
    }

    const identicalTopLines: string[] = this.ourLines.slice(0, topCursor)

    const identicalBottomLines: string[] = this.ourLines.slice(
      this.ourLines.length - bottomCursor,
      this.ourLines.length
    )

    let parts: string[]

    if (topCursor + bottomCursor === maxNumberOfLines) {
      parts = [...identicalTopLines, ...identicalBottomLines]
    } else {
      const ourNonIdenticalLines: string[] = this.ourLines.slice(
        topCursor,
        this.ourLines.length - bottomCursor
      )

      const theirNonIdenticalLines: string[] = this.theirLines.slice(
        topCursor,
        this.theirLines.length - bottomCursor
      )

      let originalParts: string[]

      if (this.hasOriginal) {
        originalParts = [
          Constants.conflictMarkerOriginal + this.textAfterMarkerOriginal,
          ...this.originalLines,
        ]
      } else {
        originalParts = []
      }

      parts = [
        ...identicalTopLines,
        Constants.conflictMarkerOurs + this.textAfterMarkerOurs,
        ...ourNonIdenticalLines,
        ...originalParts,
        Constants.conflictMarkerTheirs + this.textAfterMarkerTheirs,
        ...theirNonIdenticalLines,
        Constants.conflictMarkerEnd + this.textAfterMarkerEnd,
        ...identicalBottomLines,
      ]
    }

    return parts.filter((part) => part.length > 0).join('')
  }

  public addOriginalLine(line: string): void {
    this.originalLines.push(line)
  }

  public addOurLine(line: string): void {
    this.ourLines.push(line)
  }

  public addTheirLine(line: string): void {
    this.theirLines.push(line)
  }

  public setTextAfterMarkerEnd(text: string): void {
    this.textAfterMarkerEnd = text
  }

  public setTextAfterMarkerOriginal(text: string): void {
    this.textAfterMarkerOriginal = text
  }

  public setTextAfterMarkerOurs(text: string): void {
    this.textAfterMarkerOurs = text
  }

  public setTextAfterMarkerTheirs(text: string): void {
    this.textAfterMarkerTheirs = text
  }

  public computeRanges(startLine: number, endLine: number) {
    // line numbers start from 0, and do not include conflict markers
    let oursEndLine = startLine + 1 + this.ourLines.length - 1
    this.ourRange = new Range(
      new Position(startLine + 1, 0),
      new Position(
        oursEndLine,
        this.ourLines.length > 0
          ? this.ourLines[this.ourLines.length - 1].length - 1
          : 0
      )
    )
    if (this.hasOriginal) {
      let orgEndLine = oursEndLine + 1 + this.originalLines.length
      this.originalRange = new Range(
        new Position(oursEndLine + 2, 0),
        new Position(
          orgEndLine,
          this.originalLines.length > 0
            ? this.originalLines[this.originalLines.length - 1].length - 1
            : 0
        )
      )
      this.theirRange = new Range(
        new Position(orgEndLine + 2, 0),
        new Position(
          endLine - 1,
          this.theirLines.length > 0
            ? this.theirLines[this.theirLines.length - 1].length - 1
            : 0
        )
      )
    } else {
      this.theirRange = new Range(
        new Position(oursEndLine + 2, 0),
        new Position(
          endLine - 1,
          this.theirLines.length > 0
            ? this.theirLines[this.theirLines.length - 1].length - 1
            : 0
        )
      )
    }
  }
}
