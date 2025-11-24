import type { QuoteItem, BoxInfo } from '@/types/quotes'

type BoxCatalogItem = {
  code: string
  name: string
  length: number
  width: number
  height: number
  maxWeight: number
}

const STANDARD_BOXES: BoxCatalogItem[] = [
  { code: 'S1',   name: 'Small 12x9x6',    length: 12, width: 9,  height: 6,  maxWeight: 150 },
  { code: 'S2',   name: 'Small 12x12x12',  length: 12, width: 12, height: 12, maxWeight: 150 },
  { code: 'M1',   name: 'Medium 14x10x8',  length: 14, width: 10, height: 8,  maxWeight: 150 },
  { code: 'M2',   name: 'Medium 14x14x14', length: 14, width: 14, height: 14, maxWeight: 150 },
  { code: 'M3',   name: 'Medium 16x12x10', length: 16, width: 12, height: 10, maxWeight: 150 },
  { code: 'M4',   name: 'Medium 16x16x16', length: 16, width: 16, height: 16, maxWeight: 150 },
  { code: 'L1',   name: 'Large 18x12x10',  length: 18, width: 12, height: 10, maxWeight: 150 },
  { code: 'L2',   name: 'Large 18x18x18',  length: 18, width: 18, height: 18, maxWeight: 150 },
  { code: 'XL1',  name: 'XL 20x20x12',     length: 20, width: 20, height: 12, maxWeight: 150 },
  { code: 'XL2',  name: 'XL 20x20x20',     length: 20, width: 20, height: 20, maxWeight: 150 },
  { code: 'XXL1', name: 'XXL 24x18x12',    length: 24, width: 18, height: 12, maxWeight: 150 },
  { code: 'XXL2', name: 'XXL 24x24x24',    length: 24, width: 24, height: 24, maxWeight: 150 },
]

function boxVolume(box: BoxCatalogItem): number {
  return box.length * box.width * box.height
}

function boxLengthPlusGirth(box: BoxCatalogItem): number {
  // longest side is treated as length for carrier rules
  const dims = [box.length, box.width, box.height].sort((a, b) => b - a)
  const L = dims[0]
  const W = dims[1]
  const H = dims[2]
  return L + 2 * (W + H)
}

export function computeMultiBoxFromItems(
  items: QuoteItem[],
  opts?: {
    maxWeightPerBox?: number
    maxLengthPlusGirth?: number
    strategy?: 'balanced' | 'min_boxes'
  }
): { totalWeight: number; totalVolume: number; box: BoxInfo } {
  const maxWeightPerBox = opts?.maxWeightPerBox ?? 145
  const maxLengthPlusGirth = opts?.maxLengthPlusGirth ?? 165
  const strategy: 'balanced' | 'min_boxes' = opts?.strategy ?? 'balanced'

  let totalWeight = 0
  let totalVolume = 0
  let maxLength = 0
  let maxWidth = 0
  let maxHeight = 0

  for (const item of items || []) {
    const qty = item.quantity ?? 1
    const w = item.weight_lbs ?? 0
    const L = item.length ?? 0
    const W = item.width ?? 0
    const H = item.height ?? 0

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

  // Fallback for no volume: just use largestDim as a cube, split by weight
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

  // ---------------------------------------------------------------------------
  // Strategy: "min_boxes" → choose the largest feasible box and minimize box count
  // ---------------------------------------------------------------------------
  if (strategy === 'min_boxes') {
    const itemDimsSorted = [...baseItemDims].sort((a, b) => b - a)

    // 1) Candidate boxes that fit item dimensions and L+girth
    const feasibleBoxes = STANDARD_BOXES.filter((box) => {
      const boxDimsSorted = [box.length, box.width, box.height].sort((a, b) => b - a)

      // All three item dimensions must be <= box dimensions (allowing rotation)
      const fitsDims = boxDimsSorted.every((d, idx) => d >= (itemDimsSorted[idx] || 0))
      if (!fitsDims) return false

      // L + 2(W + H) within allowed limit
      if (boxLengthPlusGirth(box) > maxLengthPlusGirth) return false

      return true
    })

    if (feasibleBoxes.length > 0) {
      // 2) Choose the box with the largest volume among feasible ones
      const bestBox = feasibleBoxes.sort((a, b) => boxVolume(b) - boxVolume(a))[0]
      const bestBoxVolume = boxVolume(bestBox)

      // 3) Compute minimal box count by weight and by volume
      const weightLimitPerBox = Math.min(maxWeightPerBox, bestBox.maxWeight)
      const boxesByWeight = Math.max(1, Math.ceil(totalWeight / weightLimitPerBox))

      // 10% slack factor on volume
      const boxesByVolume = Math.max(
        1,
        Math.ceil((totalVolume * 1.1) / bestBoxVolume)
      )

      const n = Math.max(boxesByWeight, boxesByVolume)

      chosenBoxCount = n
      chosenLength = bestBox.length
      chosenWidth = bestBox.width
      chosenHeight = bestBox.height
      found = true
    }
  } else {
    // -------------------------------------------------------------------------
    // Strategy: "balanced" (default) → prefer middle boxes (M/L) first
    // -------------------------------------------------------------------------
    const MID_CODES = ['M1', 'M2', 'M3', 'M4', 'L1', 'L2']

    // Pass 1: only middle boxes (M1-M4, L1-L2)
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

    // Pass 2: if no middle box fits, allow any standard box (including XL/XXL)
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

  // Fallback: safe volumetric approximation if no standard box fits at all
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

  const weightPerBox = totalWeight / chosenBoxCount
  const box: BoxInfo = {
    boxCount: chosenBoxCount,
    weightPerBox: Number(weightPerBox.toFixed(2)),
    length: Number(chosenLength.toFixed(2)),
    width: Number(chosenWidth.toFixed(2)),
    height: Number(chosenHeight.toFixed(2)),
    largestDimension: Math.max(chosenLength, chosenWidth, chosenHeight),
  }

  return { totalWeight, totalVolume, box }
}