'use strict'

import { Uri } from 'vscode'
import { Conflict } from './Conflict'
import { ConflictSection } from './ConflictSection'
import { Constants } from './Constants'
import { ISection } from './ISection'
import { StringUtils, StartsWithResult } from './StringUtils'
import { TextSection } from './TextSection'

export class Parser {
  public static parse(uri: Uri, text: string): ISection[] {
    const sections: ISection[] = []
    const lines: string[] = Parser.getLines(text)

    let state: ParserState = ParserState.OutsideConflict
    let currentConflict: Conflict | undefined = undefined
    let currentTextLines: string[] = []
    let startLine: number = -1
    let endLine: number = -1

    for (let i = 0, len = lines.length; i < len; i++) {
      const line: string = lines[i]
      const startsWithMarkerOursResult: StartsWithResult =
        StringUtils.startsWith(line, Constants.conflictMarkerOurs)

      const startsWithMarkerBaseResult: StartsWithResult =
        StringUtils.startsWith(line, Constants.conflictMarkerBase)

      const startsWithMarkerTheirsResult: StartsWithResult =
        StringUtils.startsWith(line, Constants.conflictMarkerTheirs)

      const startsWithMarkerEndResult: StartsWithResult =
        StringUtils.startsWith(line, Constants.conflictMarkerEnd)

      if (startsWithMarkerOursResult.success) {
        startLine = i
        if (state !== ParserState.OutsideConflict) {
          throw new Error('Unexpected conflict marker' + this.formatLog(line, startLine, endLine))
        }

        if (currentTextLines.length > 0) {
          sections.push(new TextSection(currentTextLines))
          currentTextLines = []
        }

        currentConflict = new Conflict()
        currentConflict!.uri = uri
        currentConflict.setTextAfterMarkerOurs(
          startsWithMarkerOursResult.remainingText
        )
        state = ParserState.Ours
      } else if (startsWithMarkerBaseResult.success) {
        if (state !== ParserState.Ours) {
          throw new Error('Unexpected conflict marker' + this.formatLog(line, startLine, endLine))
        }

        currentConflict!.hasBase = true
        currentConflict!.setTextAfterMarkerBase(
          startsWithMarkerBaseResult.remainingText
        )
        state = ParserState.Base
      } else if (startsWithMarkerTheirsResult.success) {
        if (state !== ParserState.Ours && state !== ParserState.Base) {
          throw new Error('Unexpected conflict marker' + this.formatLog(line, startLine, endLine))
        }

        currentConflict!.setTextAfterMarkerTheirs(
          startsWithMarkerTheirsResult.remainingText
        )
        state = ParserState.Theirs
      } else if (startsWithMarkerEndResult.success) {
        if (state !== ParserState.Theirs) {
          throw new Error('Unexpected conflict marker' + this.formatLog(line, startLine, endLine))
        }

        currentConflict!.setTextAfterMarkerEnd(
          startsWithMarkerEndResult.remainingText
        )
        endLine = i
        currentConflict!.computeRanges(startLine, endLine)
        sections.push(new ConflictSection(currentConflict!))
        currentConflict = undefined
        state = ParserState.OutsideConflict
      } else {
        if (state === ParserState.OutsideConflict) {
          currentTextLines.push(line)
        } else if (state === ParserState.Ours) {
          currentConflict!.addOurLine(line)
        } else if (state === ParserState.Base) {
          currentConflict!.addBaseLine(line)
        } else if (state === ParserState.Theirs) {
          currentConflict!.addTheirLine(line)
        } else {
          throw new Error('Unexpected state' + this.formatLog(line, startLine, endLine))
        }
      }
    }

    if (currentConflict) {
      throw new Error('Conflict still open' + this.formatLog('', startLine, endLine))
    }

    if (currentTextLines.length > 0) {
      sections.push(new TextSection(currentTextLines))
    }

    return sections
  }

  private static formatLog(line: string, startLine: number, endLine: number): string {
    return '(' + startLine + '-' + endLine + ')' + ': ' + line
  }

  public static getLines(text: string): string[] {
    const lines: string[] = []
    const textLength: number = text.length

    let currentCharacters: string[] = []

    for (let i: number = 0; i < textLength; i++) {
      const character: string = text.charAt(i)

      if (character === '\n') {
        currentCharacters.push(character)
        lines.push(currentCharacters.join(''))
        currentCharacters = []
      } else {
        if (i > 0 && text.charAt(i - 1) === '\r') {
          lines.push(currentCharacters.join(''))
          currentCharacters = [character]
        } else {
          currentCharacters.push(character)
        }
      }
    }

    if (currentCharacters.length > 0) {
      lines.push(currentCharacters.join(''))
    }

    return lines
  }
}

const enum ParserState {
  OutsideConflict,
  Ours,
  Base,
  Theirs,
}
