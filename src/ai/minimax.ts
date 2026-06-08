import {
  BOARD_FILES,
  BOARD_RANKS,
  allLegalMoves,
  applyMove,
  getGameStatus,
  getPieceAt,
  isInCheck,
  type Color,
  type GameState,
  type Move,
  type Piece,
} from '../engine'
import { runeById, suggestAiRune } from '../runes'
import { hexTrainingProfile } from './hexTrainingProfile'

export type AiDifficulty = 'easy' | 'normal' | 'hard'

const depthByDifficulty: Record<AiDifficulty, number> = {
  easy: 1,
  normal: 2,
  hard: 3,
}

const pieceValue = hexTrainingProfile.pieceValue
const feature = hexTrainingProfile.feature

const activeRuneIds = ['rune-shield', 'chrono-swap', 'dead-return', 'hex-teleport', 'tiger-tally', 'sun-bin-feint']

function opponent(color: Color) {
  return color === 'red' ? 'black' : 'red'
}

function crossedRiver(piece: Piece, rank: number) {
  return piece.color === 'red' ? rank <= 4 : rank >= 5
}

function advancement(piece: Piece, rank: number) {
  return piece.color === 'red' ? 9 - rank : rank
}

function isPortalSquare(state: GameState, file: number, rank: number) {
  return state.modifiers.portals.some(
    (portal) => (portal.a.file === file && portal.a.rank === rank) || (portal.b.file === file && portal.b.rank === rank),
  )
}

function activeRuneScore(state: GameState, color: Color) {
  return state.players[color].runes.reduce((sum, id) => {
    const rune = runeById[id]
    if (!rune || !activeRuneIds.includes(id)) return sum
    const cost = Math.max(1, (rune.energyCost ?? 0) - (state.players[color].coreAugment === 'hundred-schools' ? 1 : 0))
    if (state.players[color].energy >= cost) return sum + feature.activeRuneReady + rune.strength * 14
    if (state.players[color].energy + 1 >= cost) return sum + feature.activeRuneNearReady + rune.strength * 7
    return sum
  }, 0)
}

function materialAndHexFeatures(state: GameState, color: Color) {
  let score = 0
  for (let rank = 0; rank < BOARD_RANKS; rank += 1) {
    for (let file = 0; file < BOARD_FILES; file += 1) {
      const piece = state.board[rank][file]
      if (!piece) continue
      const sign = piece.color === color ? 1 : -1
      let value = pieceValue[piece.type] + (piece.shield ?? 0) * feature.shield
      if (piece.type === 'soldier') {
        if (crossedRiver(piece, rank)) value += feature.riverSoldier
        value += advancement(piece, rank) * 5
        if (rank <= 2 || rank >= 7) value += feature.advancedSoldier
      }
      if (piece.type === 'advisor' && file >= 3 && file <= 5) value += feature.palaceGuard
      if ((piece.type === 'chariot' || piece.type === 'cannon' || piece.type === 'horse') && piece.shield) value += feature.protectedMajor
      if (isPortalSquare(state, file, rank)) value += feature.portalControl
      score += sign * value
    }
  }
  return score
}

function cannonScreenScore(state: GameState, color: Color) {
  let score = 0
  for (let rank = 0; rank < BOARD_RANKS; rank += 1) {
    for (let file = 0; file < BOARD_FILES; file += 1) {
      const piece = state.board[rank][file]
      if (piece?.type !== 'cannon') continue
      const sign = piece.color === color ? 1 : -1
      const screens = [
        getPieceAt(state, { file: file - 1, rank }),
        getPieceAt(state, { file: file + 1, rank }),
        getPieceAt(state, { file, rank: rank - 1 }),
        getPieceAt(state, { file, rank: rank + 1 }),
      ].filter(Boolean).length
      score += sign * screens * feature.cannonScreen
    }
  }
  return score
}

export function evaluateHexState(state: GameState, aiColor: Color): number {
  const status = getGameStatus(state)
  if (status.result === 'checkmate') return status.winner === aiColor ? 999999 : -999999
  if (status.result === 'stalemate') return status.winner === aiColor ? 50000 : -50000

  const enemy = opponent(aiColor)
  const ownMoves = allLegalMoves(state, aiColor)
  const enemyMoves = allLegalMoves(state, enemy)
  let score = materialAndHexFeatures(state, aiColor) + cannonScreenScore(state, aiColor)

  score += (state.players[aiColor].energy - state.players[enemy].energy) * feature.energy
  if (state.players[aiColor].energy <= 4) score += state.players[aiColor].energy * feature.lowEnergyBonus
  if (state.players[enemy].energy <= 4) score -= state.players[enemy].energy * feature.lowEnergyBonus

  score += state.players[aiColor].runes.reduce((sum, id) => sum + (runeById[id]?.strength ?? 0) * feature.passiveRuneStrength, 0)
  score -= state.players[enemy].runes.reduce((sum, id) => sum + (runeById[id]?.strength ?? 0) * feature.passiveRuneStrength, 0)
  score += activeRuneScore(state, aiColor) - activeRuneScore(state, enemy)
  const ownCoreValue = hexTrainingProfile.coreValue[state.players[aiColor].coreAugment ?? ''] ?? 0
  const enemyCoreValue = hexTrainingProfile.coreValue[state.players[enemy].coreAugment ?? ''] ?? 0
  score += ownCoreValue - enemyCoreValue

  if (isInCheck(state, aiColor)) score += feature.checkTaken
  if (isInCheck(state, enemy)) score += feature.checkGiven
  score += (ownMoves.length - enemyMoves.length) * feature.mobility
  score += ownMoves.reduce((sum, move) => sum + (move.captured ? pieceValue[move.captured.type] * feature.captureThreat : 0), 0)
  score -= enemyMoves.reduce((sum, move) => sum + (move.captured ? pieceValue[move.captured.type] * feature.captureThreat : 0), 0)
  score += state.modifiers.portals.length * feature.portalMobility
  return score
}

function evaluate(state: GameState, aiColor: Color): number {
  return evaluateHexState(state, aiColor)
}

function search(state: GameState, depth: number, alpha: number, beta: number, aiColor: Color): number {
  const status = getGameStatus(state)
  if (depth === 0 || status.result === 'checkmate' || status.result === 'stalemate') return evaluate(state, aiColor)

  const maximizing = state.turn === aiColor
  const moves = allLegalMoves(state)
  if (maximizing) {
    let value = -Infinity
    for (const move of moves) {
      value = Math.max(value, search(applyMove(state, move), depth - 1, alpha, beta, aiColor))
      alpha = Math.max(alpha, value)
      if (alpha >= beta) break
    }
    return value
  }

  let value = Infinity
  for (const move of moves) {
    value = Math.min(value, search(applyMove(state, move), depth - 1, alpha, beta, aiColor))
    beta = Math.min(beta, value)
    if (alpha >= beta) break
  }
  return value
}

export function chooseAiMove(state: GameState, difficulty: AiDifficulty): Move | null {
  const aiColor = state.turn
  const stateAfterRune = suggestAiRune(state, aiColor)
  const depth = depthByDifficulty[difficulty]
  let best: Move | null = null
  let bestScore = -Infinity
  const moves = allLegalMoves(stateAfterRune)
  const ordered = [...moves].sort((a, b) => (b.captured ? pieceValue[b.captured.type] : 0) - (a.captured ? pieceValue[a.captured.type] : 0))
  for (const move of ordered) {
    const score = search(applyMove(stateAfterRune, move), depth - 1, -Infinity, Infinity, aiColor)
    if (score > bestScore) {
      bestScore = score
      best = move
    }
  }
  return best
}

export function chooseHexAwareMove(state: GameState, difficulty: AiDifficulty, preferredMove?: Move | null): Move | null {
  const tacticalMove = chooseAiMove(state, difficulty)
  if (!preferredMove || !tacticalMove) return preferredMove ?? tacticalMove
  const aiColor = state.turn
  const preferredScore = search(applyMove(state, preferredMove), Math.max(0, depthByDifficulty[difficulty] - 2), -Infinity, Infinity, aiColor)
  const tacticalScore = search(applyMove(state, tacticalMove), Math.max(0, depthByDifficulty[difficulty] - 2), -Infinity, Infinity, aiColor)
  return tacticalScore > preferredScore + 140 ? tacticalMove : preferredMove
}

export function maybeUseAiRune(state: GameState): GameState {
  return suggestAiRune(state, state.turn)
}
