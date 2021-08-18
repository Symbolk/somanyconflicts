'use strict'

export class StringUtils {
  public static startsWith(thisText: string, otherText: string): StartsWithResult {
    if (thisText.startsWith(otherText)) {
      return {
        success: true,
        remainingText: thisText.substr(otherText.length),
      }
    }

    return {
      success: false,
    }
  }

  public static countSymbol(codeLines: string[], symbol: string): number {
    let count = 0

    for (let i = 0; i < codeLines.length; i++) {
      count += codeLines[i].trim().split(symbol).length - 1
      // line.match(new RegExp(symbol, "g")) || []).length)
    }

    return count
  }

  public static countOpenBraces(codeLines: string[]): number {
    return this.countSymbol(codeLines, '{') - this.countSymbol(codeLines, '}')
  }
}

export type StartsWithResult =
  | {
      success: true
      remainingText: string
    }
  | {
      success: false
    }
