import type { QuoteItem } from '@/types/quotes'

export type BoxInfo = {
  boxCount: number
  weightPerBox: number
  length: number
  width: number
  height: number
  largestDimension: number
}

export type MultiBoxResult = {
  totalWeight: number
  totalVolume: number
  box: BoxInfo
}

export type PackingStrategy = 'balanced' | 'min_boxes'

type ComputeOptions = {
  maxWeightPerBox?: number
  maxLengthPlusGirth?: number
  strategy?: PackingStrategy
}

// Standard catalog of boxes used for multi-box packing (same family used in the edge)
type StandardBox = {
  code: string
  length: number
  width: number
  height: number
  maxWeight: number
}

const STANDARD_BOXES: StandardBox[] = [
  // Small
  { code: 'S1', length: 8, width: 6, height: 4, maxWeight: 40 },
  { code: 'S2', length: 10, width: 8, height: 6, maxWeight: 40 },
  // Medium
  { code: 'M1', length: 12, width: 10, height: 8, maxWeight: 50 },
  { code: 'M2', length: 14, width: 12, height: 10, maxWeight: 50 },
  { code: 'M3', length: 16, width: 12, height: 12, maxWeight: 55 },
  { code: 'M4', length: 18, width: 14, height: 12, maxWeight: 55 },
  // Large
  { code: 'L1', length: 18, width: 18, height: 16, maxWeight: 60 },
  { code: 'L2', length: 20, width: 20, height: 18, maxWeight: 60 },
  // XL / XXL
  { code: 'XL1', length: 22, width: 22, height: 20, maxWeight: 70 },
  { code: 'XL2', length: 24, width: 18, height: 18, maxWeight: 70 },
  { code: 'XXL1', length: 24, width: 24, height: 20, maxWeight: 70 },
  { code: 'XXL2', length: 24, width: 24, height: 24, maxWeight: 70 },
]

function boxVolume(box: StandardBox): number {
  return box.length * box.width * box.height
}

function boxLengthPlusGirth(box: StandardBox): number {
  return box.length + 2 * (box.width + box.height)
}

/**
 * Core multi-box packing engine shared by frontend and backend.
 * Returns identical boxes (count + dims + weight per box) from a list of items.
 */
export function computeMultiBoxFromItems(
  items: QuoteItem[],
  opts: ComputeOptions = {},
): MultiBoxResult {
  const maxWeightPerBox = opts.maxWeightPerBox ?? 145 // keep under UPS 150 lb
  const maxLengthPlusGirth = opts.maxLengthPlusGirth ?? 165
  const requestedStrategy: PackingStrategy =
    opts.strategy === 'min_boxes' ? 'min_boxes' : 'balanced'

  let totalWeight = 0
  let totalVolume = 0
  let maxLength = 0
  let maxWidth = 0
  let maxHeight = 0

  for (const item of items ?? []) {
    const qty = Number(item.quantity ?? 1)
    const w = Number((item as any).weight_lbs ?? 0)
    const L = Number((item as any).length ?? 0)
    const W = Number((item as any).width ?? 0)
    const H = Number((item as any).height ?? 0)

    totalWeight += w * qty

    if (L && W && H) {
      totalVolume += L * W * H * qty
    }

    if (L > maxLength) maxLength = L
    if (W > maxWidth) maxWidth = W
    if (H > maxHeight) maxHeight = H
  }

  const largestDim = Math.max(maxLength, maxWidth, maxHeight)
  let minBoxesByWeight = Math.ceil(totalWeight / maxWeightPerBox)
  if (minBoxesByWeight < 1) minBoxesByWeight = 1

  // Decide effective strategy: for heavier / multi-box shipments,
  // even if the user requested 'balanced', we fall back to 'min_boxes'
  // because larger boxes with fewer total packages are usually cheaper
  // in real parcel pricing.
  let strategy: PackingStrategy = requestedStrategy
  if (requestedStrategy === 'balanced') {
    const heavyOrManyBoxes = totalWeight >= 100 || minBoxesByWeight >= 3
    if (heavyOrManyBoxes) {
      strategy = 'min_boxes'
    }
  }

  // If we don't have volume, fallback to a simple cubic approximation
  if (!totalVolume || totalVolume <= 0) {
    const boxCount = minBoxesByWeight
    const weightPerBox = totalWeight / boxCount
    const side = largestDim || 0
    return {
      totalWeight,
      totalVolume,
      box: {
        boxCount,
        weightPerBox: Number(weightPerBox.toFixed(2)),
        length: side,
        width: side,
        height: side,
        largestDimension: largestDim,
      },
    }
  }

  let chosenBoxCount = minBoxesByWeight
  let chosenLength = 0
  let chosenWidth = 0
  let chosenHeight = 0
  let found = false

  const baseItemDims = [maxLength, maxWidth, maxHeight]

  if (strategy === 'min_boxes') {
    // -------------------------------------------------------------------
    // Strategy: min_boxes → choose the biggest feasible box and minimize
    // number of boxes, respecting weight/dims/L+girth constraints.
    // -------------------------------------------------------------------
    const itemDimsSorted = [...baseItemDims].sort((a, b) => b - a)

    const feasibleBoxes = STANDARD_BOXES.filter((box) => {
      const boxDimsSorted = [box.length, box.width, box.height].sort((a, b) => b - a)

      const fitsDims = boxDimsSorted.every((d, idx) => d >= (itemDimsSorted[idx] || 0))
      if (!fitsDims) return false

      if (boxLengthPlusGirth(box) > maxLengthPlusGirth) return false

      return true
    })

    if (feasibleBoxes.length > 0) {
      // pick the largest volume box (to minimize number of boxes)
      const bestBox = feasibleBoxes.sort((a, b) => boxVolume(b) - boxVolume(a))[0]
      const bestBoxVolume = boxVolume(bestBox)
      const weightLimitPerBox = Math.min(maxWeightPerBox, bestBox.maxWeight)
      const boxesByWeight = Math.max(1, Math.ceil(totalWeight / weightLimitPerBox))
      const boxesByVolume = Math.max(1, Math.ceil((totalVolume * 1.1) / bestBoxVolume))
      const n = Math.max(boxesByWeight, boxesByVolume)

      chosenBoxCount = n
      chosenLength = bestBox.length
      chosenWidth = bestBox.width
      chosenHeight = bestBox.height
      found = true
    }
  } else {
    // -------------------------------------------------------------------
    // Strategy: balanced → prioritize mid-size boxes (M/L) before XL/XXL
    // to keep shapes healthier for parcel networks.
    // -------------------------------------------------------------------
    const MID_CODES = ['M1', 'M2', 'M3', 'M4', 'L1', 'L2']

    // Pass 1: only middle boxes (M1–M4, L1–L2)
    for (let n = minBoxesByWeight; n <= minBoxesByWeight + 20; n++) {
      const volumePerBox = totalVolume / n
      const perBoxWeight = totalWeight / n
      const itemDims = [...baseItemDims].sort((a, b) => b - a)

      const middleCandidates = STANDARD_BOXES.filter((box) => {
        if (!MID_CODES.includes(box.code)) return false

        const vol = boxVolume(box)
        if (vol < volumePerBox * 1.1) return false

        if (perBoxWeight > Math.min(maxWeightPerBox, box.maxWeight)) return false

        if (boxLengthPlusGirth(box) > maxLengthPlusGirth) return false

        const boxDims = [box.length, box.width, box.height].sort((a, b) => b - a)
        return boxDims.every((d, idx) => d >= (itemDims[idx] || 0))
      })

      if (middleCandidates.length > 0) {
        middleCandidates.sort((a, b) => boxVolume(a) - boxVolume(b))
        const best = middleCandidates[0]

        chosenBoxCount = n
        chosenLength = best.length
        chosenWidth = best.width
        chosenHeight = best.height
        found = true
        break
      }
    }

    // Pass 2: if nothing fits in middle boxes, open to all boxes
    if (!found) {
      for (let n = minBoxesByWeight; n <= minBoxesByWeight + 20; n++) {
        const volumePerBox = totalVolume / n
        const perBoxWeight = totalWeight / n
        const itemDims = [...baseItemDims].sort((a, b) => b - a)

        const candidates = STANDARD_BOXES.filter((box) => {
          const vol = boxVolume(box)
          if (vol < volumePerBox * 1.1) return false

          if (perBoxWeight > Math.min(maxWeightPerBox, box.maxWeight)) return false

          if (boxLengthPlusGirth(box) > maxLengthPlusGirth) return false

          const boxDims = [box.length, box.width, box.height].sort((a, b) => b - a)
          return boxDims.every((d, idx) => d >= (itemDims[idx] || 0))
        })

        if (candidates.length > 0) {
          candidates.sort((a, b) => boxVolume(a) - boxVolume(b))
          const best = candidates[0]

          chosenBoxCount = n
          chosenLength = best.length
          chosenWidth = best.width
          chosenHeight = best.height
          found = true
          break
        }
      }
    }
  }

  // Fallback: if nothing fits in standard boxes, approximate cubic box
  if (!found || !chosenLength || !chosenWidth || !chosenHeight) {
    const fallbackBoxCount = chosenBoxCount || minBoxesByWeight
    const volumePerBox = totalVolume / fallbackBoxCount
    const L = largestDim || Math.cbrt(volumePerBox)
    const crossSection = volumePerBox / L
    const side = Math.sqrt(crossSection)
    const W = side
    const H = side

    chosenBoxCount = fallbackBoxCount
    chosenLength = Number(L.toFixed(2))
    chosenWidth = Number(W.toFixed(2))
    chosenHeight = Number(H.toFixed(2))
  }

  const weightPerBox = totalWeight / (chosenBoxCount || 1)

  return {
    totalWeight,
    totalVolume,
    box: {
      boxCount: chosenBoxCount,
      weightPerBox: Number(weightPerBox.toFixed(2)),
      length: Number(chosenLength.toFixed(2)),
      width: Number(chosenWidth.toFixed(2)),
      height: Number(chosenHeight.toFixed(2)),
      largestDimension: Math.max(chosenLength, chosenWidth, chosenHeight),
    },
  }
}