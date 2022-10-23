import { Conflict } from './Conflict'
import { Identifier } from './Identifier'
const jaccard = require('jaccard')
const stringSimilarity = require('string-similarity')

export class AlgUtils {
  // compute dependency strength for two conflicts (+ from 1 to 2 (or 1>2), - from 2 to 1(or 2>1))
  public static computeDependency(conflict1: Conflict, conflict2: Conflict): number {
    // for each side, estimate and sum relevance
    const sum =
      this.computeDependencyForSide(conflict1.ours.identifiers, conflict2.ours.identifiers) +
      this.computeDependencyForSide(conflict1.base.identifiers, conflict2.base.identifiers) +
      this.computeDependencyForSide(conflict1.theirs.identifiers, conflict2.theirs.identifiers)
    return +(sum / 3).toFixed(4)
  }

  private static computeDependencyForSide(ids1: Identifier[], ids2: Identifier[]): number {
    const s1: string[] = []
    const s2: string[] = []
    ids1.forEach((s) => s1.push(s.identifier))
    ids2.forEach((s) => s2.push(s.identifier))
    return jaccard.index(s1, s2)
  }

  public static computeSimilarity(conflict1: Conflict, conflict2: Conflict): number {
    const sum =
      this.compareLineByLine(conflict1.ours.lines, conflict2.ours.lines) +
      this.compareLineByLine(conflict1.base.lines, conflict2.base.lines) +
      this.compareLineByLine(conflict1.theirs.lines, conflict2.theirs.lines)
    return +(sum / 3).toFixed(4)
  }

  public static compareLineByLine(lines1: string[], lines2: string[]): number {
    const minLength = Math.min(lines1.length, lines2.length)
    if (minLength === 0) {
      return 0
    }
    let similarity = 0.0
    for (let i = 0; i < minLength; ++i) {
      similarity += stringSimilarity.compareTwoStrings(lines1[i].trim(), lines2[i].trim())
    }
    const maxLength = Math.max(lines1.length, lines2.length)
    return +(similarity / maxLength).toFixed(4)
  }
}
