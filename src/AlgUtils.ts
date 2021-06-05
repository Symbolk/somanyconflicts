import { Conflict } from './Conflict'
import { Identifier } from './Identifier'
var jaccard = require('jaccard')
var stringSimilarity = require('string-similarity')

export class AlgUtils {
  public static estimateRelevance(conflict1: Conflict, conflict2: Conflict): number {
    // for each side, estimate and sum relevance
    let sum =
      this.estimateOneSide(conflict1.ours.identifiers, conflict2.ours.identifiers) +
      this.estimateOneSide(conflict1.base.identifiers, conflict2.base.identifiers) +
      this.estimateOneSide(conflict1.theirs.identifiers, conflict2.theirs.identifiers)
    return sum / 3
  }

  private static estimateOneSide(ids1: Identifier[], ids2: Identifier[]): number {
    let s1: string[] = []
    let s2: string[] = []
    ids1.forEach((s) => s1.push(s.identifier))
    ids2.forEach((s) => s2.push(s.identifier))
    return jaccard.index(s1, s2)
  }

  public static compareLineByLine(lines1: string[], lines2: string[]): number {
    let minLength = Math.min(lines1.length, lines2.length)
    if (minLength == 0) {
      return 0
    }
    let similarity = 0.0
    for (let i = 0; i < minLength; ++i) {
      similarity += stringSimilarity.compareTwoStrings(lines1[i].trim(), lines2[i].trim())
    }
    let maxLength = Math.max(lines1.length, lines2.length)
    return +(similarity / maxLength).toFixed(4)
  }
}
