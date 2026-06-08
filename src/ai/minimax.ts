import { allLegalMoves, applyMove, getGameStatus, isInCheck, type Color, type GameState, type Move } from '../engine'
import { runeById, suggestAiRune } from '../runes'

export type AiDifficulty = 'easy' | 'normal' | 'hard'

const depthByDifficulty: Record<AiDifficulty, number> = {
  easy: 1,
  normal: 2,
  hard: 3,
}

const pieceValue = {
  general: 10000,
  chariot: 900,
  cannon: 450,
  horse: 400,
  elephant: 220,
  advisor: 220,
  soldier: 120,
}

function evaluate(state: GameState, aiColor: Color): number {
  const status = getGameStatus(state)
  if (status.result === 'checkmate') return status.winner === aiColor ? 999999 : -999999
  if (status.result === 'stalemate') return status.winner === aiColor ? 50000 : -50000

  let score = 0
  for (const rank of state.board) {
    for (const piece of rank) {
      if (!piece) continue
      const sign = piece.color === aiColor ? 1 : -1
      const riverBonus = piece.type === 'soldier' && (piece.color === 'red' ? piece.color === aiColor : piece.color === aiColor) ? 12 : 0
      score += sign * (pieceValue[piece.type] + (piece.shield ?? 0) * 45 + riverBonus)
    }
  }

  score += (state.players[aiColor].energy - state.players[aiColor === 'red' ? 'black' : 'red'].energy) * 18
  score += state.players[aiColor].runes.reduce((sum, id) => sum + (runeById[id]?.strength ?? 0) * 10, 0)
  score -= state.players[aiColor === 'red' ? 'black' : 'red'].runes.reduce((sum, id) => sum + (runeById[id]?.strength ?? 0) * 10, 0)
  if (isInCheck(state, aiColor)) score -= 280
  if (isInCheck(state, aiColor === 'red' ? 'black' : 'red')) score += 220
  score += allLegalMoves(state, aiColor).length * 2
  score -= allLegalMoves(state, aiColor === 'red' ? 'black' : 'red').length * 2
  return score
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

export function maybeUseAiRune(state: GameState): GameState {
  return suggestAiRune(state, state.turn)
}
