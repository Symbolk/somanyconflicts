import { Conflict } from './Conflict'
import { Identifier } from './Identifier'
var jaccard = require('jaccard')

export class AlgUtils {
  public static estimateRelevance(
    conflict1: Conflict,
    conflict2: Conflict
  ): number {
    // for each side, estimate and sum relevance
    let sum =
      this.estimateOneSide(
        conflict1.ours.identifiers,
        conflict2.ours.identifiers
      ) +
      this.estimateOneSide(
        conflict1.base.identifiers,
        conflict2.base.identifiers
      ) +
      this.estimateOneSide(
        conflict1.theirs.identifiers,
        conflict2.theirs.identifiers
      )
    return sum / 3
  }

  private static estimateOneSide(
    ids1: Identifier[],
    ids2: Identifier[]
  ): number {
    let s1: string[] = []
    let s2: string[] = []
    ids1.forEach((s) => s1.push(s.identifier))
    ids2.forEach((s) => s2.push(s.identifier))
    return jaccard.index(s1, s2)
  }
}
