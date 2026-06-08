import { allLegalMoves, isInCheck } from './rules'
import type { Color, GameState, GameStatus } from './types'

export function getGameStatus(state: GameState): GameStatus {
  if (state.phase === 'ended') {
    return {
      result: state.result,
      winner: state.winner,
      inCheck: false,
      legalMoveCount: 0,
      message: state.message,
    }
  }
  const inCheck = isInCheck(state, state.turn)
  const legalMoveCount = allLegalMoves(state).length
  if (inCheck && legalMoveCount === 0) {
    const winner: Color = state.turn === 'red' ? 'black' : 'red'
    return { result: 'checkmate', winner, inCheck, legalMoveCount, message: `${winner === 'red' ? '红方' : '黑方'}将死取胜` }
  }
  if (!inCheck && legalMoveCount === 0) {
    const winner: Color = state.turn === 'red' ? 'black' : 'red'
    return { result: 'stalemate', winner, inCheck, legalMoveCount, message: `${state.turn === 'red' ? '红方' : '黑方'}困毙` }
  }
  if (inCheck) return { result: 'check', inCheck, legalMoveCount, message: '将军' }
  return { result: 'playing', inCheck, legalMoveCount, message: '对局进行中' }
}

export function withStatus(state: GameState): GameState {
  const status = getGameStatus(state)
  return {
    ...state,
    result: status.result,
    winner: status.winner,
    message: status.message,
    phase: status.result === 'checkmate' || status.result === 'stalemate' ? 'ended' : state.phase,
  }
}
