import {
  MAX_ENERGY,
  allLegalMoves,
  applyMove,
  cloneState,
  getPieceAt,
  isInCheck,
  setPieceAt,
  type Color,
  type GameState,
  type Square,
} from '../engine'
import { canAffordRune, isOwnPiece, runeById, type RuneContext } from './definitions'
import { coreAugmentById } from './definitions'

export function applyDraftRune(state: GameState, color: Color, runeId: string): GameState {
  const rune = runeById[runeId]
  if (!rune || !canAffordRune(state, color, rune)) return state
  const next = cloneState(state)
  next.players[color].runes.push(runeId)
  next.players[color].budgetUsed += rune.points

  if (runeId === 'steel-fortress') shieldAroundGeneral(next, color)
  if (runeId === 'hex-portals') next.modifiers.portals.push({ a: { file: 1, rank: 4 }, b: { file: 7, rank: 5 } })
  if (runeId === 'rift-file') next.modifiers.elephantRiftFiles[color] = [4]
  if (runeId === 'golden-capacitor') next.players[color].energy = Math.min(MAX_ENERGY, next.players[color].energy + 1)
  if (runeId === 'prism-core') next.players[color].energy = Math.min(MAX_ENERGY, next.players[color].energy + 2)
  if (runeId === 'last-stand') shieldGeneral(next, color)
  if (runeId === 'mozi-city') shieldPieces(next, color, ['chariot'])

  return next
}

export function applyCoreAugment(state: GameState, color: Color, augmentId: string): GameState {
  const augment = coreAugmentById[augmentId]
  if (!augment || state.players[color].coreAugment) return state
  const next = cloneState(state)
  next.players[color].coreAugment = augmentId
  if (augmentId === 'golden-aegis') shieldPalaceCore(next, color)
  if (augmentId === 'great-wall-beacons') shieldPieces(next, color, ['soldier'])
  if (augmentId === 'imperial-arsenal') shieldPieces(next, color, ['chariot', 'cannon'])
  if (augmentId === 'yumen-pass') next.modifiers.elephantRiftFiles[color] = [0, 8]
  if (augmentId === 'warring-states') next.players[color].energy = Math.min(MAX_ENERGY, next.players[color].energy + 2)
  if (augmentId === 'singularity-gates') {
    const existing = next.modifiers.portals.some((portal) => portal.a.file === 2 && portal.a.rank === 4)
    if (!existing) {
      next.modifiers.portals.push({ a: { file: 2, rank: 4 }, b: { file: 6, rank: 5 } })
      next.modifiers.portals.push({ a: { file: 6, rank: 4 }, b: { file: 2, rank: 5 } })
    }
  }
  if (augmentId === 'royal-road') {
    const existing = next.modifiers.portals.some((portal) => portal.a.file === 0 && portal.a.rank === 4)
    if (!existing) next.modifiers.portals.push({ a: { file: 0, rank: 4 }, b: { file: 8, rank: 5 } })
  }
  if (augmentId === 'nine-province-map') {
    const existing = next.modifiers.portals.some((portal) => portal.a.file === 0 && portal.a.rank === 5)
    if (!existing) next.modifiers.portals.push({ a: { file: 0, rank: 5 }, b: { file: 8, rank: 4 } })
  }
  if (augmentId === 'chrono-storm') next.modifiers.chronoStorm = true
  return next
}

function shieldPieces(state: GameState, color: Color, types: Array<'soldier' | 'chariot' | 'cannon'>) {
  for (let rank = 0; rank < 10; rank += 1) {
    for (let file = 0; file < 9; file += 1) {
      const piece = state.board[rank][file]
      if (piece?.color === color && types.includes(piece.type as 'soldier' | 'chariot' | 'cannon')) {
        piece.shield = (piece.shield ?? 0) + 1
      }
    }
  }
}

function shieldPalaceCore(state: GameState, color: Color) {
  for (let rank = 0; rank < 10; rank += 1) {
    for (let file = 0; file < 9; file += 1) {
      const piece = state.board[rank][file]
      if (piece?.color === color && (piece.type === 'general' || piece.type === 'advisor')) {
        piece.shield = (piece.shield ?? 0) + 1
      }
    }
  }
}

function shieldGeneral(state: GameState, color: Color) {
  for (let rank = 0; rank < 10; rank += 1) {
    for (let file = 0; file < 9; file += 1) {
      const piece = state.board[rank][file]
      if (piece?.color === color && piece.type === 'general') piece.shield = (piece.shield ?? 0) + 1
    }
  }
}

function shieldAroundGeneral(state: GameState, color: Color) {
  let center: Square | null = null
  for (let rank = 0; rank < 10; rank += 1) {
    for (let file = 0; file < 9; file += 1) {
      const piece = state.board[rank][file]
      if (piece?.color === color && piece.type === 'general') center = { file, rank }
    }
  }
  if (!center) return
  for (let rank = center.rank - 1; rank <= center.rank + 1; rank += 1) {
    for (let file = center.file - 1; file <= center.file + 1; file += 1) {
      const piece = state.board[rank]?.[file]
      if (piece?.color === color) piece.shield = (piece.shield ?? 0) + 1
    }
  }
}

function spendEnergy(state: GameState, color: Color, runeId: string) {
  const rune = runeById[runeId]
  const discount = state.players[color].coreAugment === 'hundred-schools' ? 1 : 0
  const cost = Math.max(1, (rune.energyCost ?? 0) - discount)
  if (state.players[color].energy < cost) return null
  const next = cloneState(state)
  next.players[color].energy -= cost
  return next
}

export function activateRune(state: GameState, runeId: string, context: RuneContext): GameState {
  if (!state.players[context.color].runes.includes(runeId)) return state
  if (runeId === 'rune-shield') return activateShield(state, runeId, context)
  if (runeId === 'chrono-swap') return activateSwap(state, runeId, context)
  if (runeId === 'dead-return') return activateRevive(state, runeId, context)
  if (runeId === 'hex-teleport') return activateTeleport(state, runeId, context)
  if (runeId === 'tiger-tally') return activateTigerTally(state, runeId, context)
  if (runeId === 'sun-bin-feint') return activateWideSwap(state, runeId, context)
  if (runeId === 'silent-engine') return spendEnergy(state, context.color, runeId) ?? state
  return state
}

function activateTigerTally(state: GameState, runeId: string, context: RuneContext) {
  if (!context.target) return state
  const piece = getPieceAt(state, context.target)
  if (!isOwnPiece(piece, context.color) || !['chariot', 'horse', 'cannon'].includes(piece.type)) return state
  const next = spendEnergy(state, context.color, runeId)
  if (!next) return state
  const target = getPieceAt(next, context.target)
  if (target) target.shield = (target.shield ?? 0) + 1
  next.message = '虎符发兵：精锐获得护阵。'
  return next
}

function activateWideSwap(state: GameState, runeId: string, context: RuneContext) {
  if (!context.target || !context.secondaryTarget) return state
  const first = getPieceAt(state, context.target)
  const second = getPieceAt(state, context.secondaryTarget)
  if (!isOwnPiece(first, context.color) || !isOwnPiece(second, context.color)) return state
  const next = spendEnergy(state, context.color, runeId)
  if (!next) return state
  setPieceAt(next.board, context.target, second)
  setPieceAt(next.board, context.secondaryTarget, first)
  next.message = '孙膑减灶：两军暗换其位。'
  return isInCheck(next, context.color) ? state : next
}

function activateShield(state: GameState, runeId: string, context: RuneContext) {
  if (!context.target) return state
  const piece = getPieceAt(state, context.target)
  if (!isOwnPiece(piece, context.color)) return state
  const next = spendEnergy(state, context.color, runeId)
  if (!next) return state
  const target = getPieceAt(next, context.target)
  if (target) target.shield = (target.shield ?? 0) + 1
  next.message = `${context.color === 'red' ? '红方' : '黑方'}激活符文护盾`
  return next
}

function activateSwap(state: GameState, runeId: string, context: RuneContext) {
  if (!context.target || !context.secondaryTarget) return state
  const first = getPieceAt(state, context.target)
  const second = getPieceAt(state, context.secondaryTarget)
  const adjacent =
    Math.abs(context.target.file - context.secondaryTarget.file) +
      Math.abs(context.target.rank - context.secondaryTarget.rank) ===
    1
  if (!adjacent || !isOwnPiece(first, context.color) || !isOwnPiece(second, context.color)) return state
  const next = spendEnergy(state, context.color, runeId)
  if (!next) return state
  setPieceAt(next.board, context.target, second)
  setPieceAt(next.board, context.secondaryTarget, first)
  next.message = '时空错位完成'
  return isInCheck(next, context.color) ? state : next
}

function activateRevive(state: GameState, runeId: string, context: RuneContext) {
  const capturedIndex = state.players[context.color].captured.findIndex((piece) => piece.type === 'soldier')
  if (capturedIndex < 0) return state
  const rank = context.color === 'red' ? 9 : 0
  const file = [0, 2, 4, 6, 8].find((candidate) => !state.board[rank][candidate])
  if (file === undefined) return state
  const next = spendEnergy(state, context.color, runeId)
  if (!next) return state
  const revived = next.players[context.color].captured.splice(capturedIndex, 1)[0]
  setPieceAt(next.board, { file, rank }, { ...revived, shield: 0 })
  next.message = '亡者归来：士兵重返底线'
  return next
}

function activateTeleport(state: GameState, runeId: string, context: RuneContext) {
  if (!context.target || !context.secondaryTarget) return state
  const piece = getPieceAt(state, context.target)
  if (!isOwnPiece(piece, context.color) || getPieceAt(state, context.secondaryTarget)) return state
  const next = spendEnergy(state, context.color, runeId)
  if (!next) return state
  setPieceAt(next.board, context.target, null)
  setPieceAt(next.board, context.secondaryTarget, piece)
  const opponent = context.color === 'red' ? 'black' : 'red'
  if (isInCheck(next, opponent)) return state
  next.message = '奇门遁甲完成'
  return next
}

export function suggestAiRune(state: GameState, color: Color): GameState {
  const affordable = state.players[color].runes
    .map((id) => runeById[id])
    .filter((rune) => rune.type === 'active' && Math.max(1, (rune.energyCost ?? 0) - (state.players[color].coreAugment === 'hundred-schools' ? 1 : 0)) <= state.players[color].energy)
  if (affordable.some((rune) => rune.id === 'dead-return') && state.players[color].captured.some((piece) => piece.type === 'soldier')) {
    const next = activateRune(state, 'dead-return', { color })
    if (next !== state) return next
  }
  if (affordable.some((rune) => rune.id === 'rune-shield')) {
    const threatened = allLegalMoves({ ...state, turn: color === 'red' ? 'black' : 'red' }).find((move) => move.captured?.color === color)
    if (threatened?.to) return activateRune(state, 'rune-shield', { color, target: threatened.to })
  }
  if (affordable.some((rune) => rune.id === 'tiger-tally')) {
    const threatenedMajor = allLegalMoves({ ...state, turn: color === 'red' ? 'black' : 'red' }).find(
      (move) => move.captured?.color === color && ['chariot', 'horse', 'cannon'].includes(move.captured.type),
    )
    if (threatenedMajor?.to) return activateRune(state, 'tiger-tally', { color, target: threatenedMajor.to })
  }
  return state
}

export function applyMoveWithStatus(state: GameState, move: Parameters<typeof applyMove>[1]) {
  return applyMove(state, move)
}
