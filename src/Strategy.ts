'use strict'

// resolution stratety

export const Strategy = {
  Unknown: { index: 0, display: 'Unknown' },
  AcceptOurs: { index: 1, display: 'Accept Current' },
  AcceptTheirs: { index: 2, display: 'Accept Incoming' },
  AcceptBase: { index: 3, display: 'Accept Base' },
  AcceptBoth: { index: 4, display: 'Accept Both' },
  AcceptNone: { index: 5, display: 'Accept None' }
}

export type Strategy = typeof Strategy[keyof typeof Strategy]

export function getStrategy(probs: Array<number>) {
  let maxIndex = probs.reduce((iMax, x, i, arr) => (x > arr[iMax] ? i : iMax), 0)
  let k: keyof typeof Strategy
  for (k in Strategy) {
    if (Strategy[k].index == maxIndex) {
      return Strategy[k]
    }
  }
  return Strategy.Unknown
}
