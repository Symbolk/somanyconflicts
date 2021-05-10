'use strict'

export class StringUtils {
  public static startsWith(
    thisText: string,
    otherText: string
  ): StartsWithResult {
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
}

export type StartsWithResult =
  | {
      success: true
      remainingText: string
    }
  | {
      success: false
    }
