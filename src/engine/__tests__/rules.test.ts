import { describe, expect, it } from 'vitest'
import {
  allLegalMoves,
  applyMove,
  createEmptyBoard,
  createInitialState,
  getGameStatus,
  getLegalMoves,
  isInCheck,
  setPieceAt,
  type GameState,
  type Piece,
} from '..'
import { applyDraftRune, generateDraftPool, RUNE_BUDGET, RUNE_SLOTS } from '../../runes'
import { chooseAiMove } from '../../ai/minimax'
import { toXiangqiFen } from '../../ai/fairyStockfish'

function piece(id: string, color: 'red' | 'black', type: Piece['type']): Piece {
  return { id, color, type }
}

function stateWith(...entries: Array<[number, number, Piece]>): GameState {
  const state = createInitialState()
  state.board = createEmptyBoard()
  state.phase = 'playing'
  state.turn = 'red'
  entries.forEach(([file, rank, placed]) => setPieceAt(state.board, { file, rank }, placed))
  return state
}

describe('xiangqi engine', () => {
  it('creates the standard opening position', () => {
    const state = createInitialState()
    const pieces = state.board.flat().filter(Boolean)
    expect(pieces).toHaveLength(32)
    expect(state.board[9][4]?.type).toBe('general')
    expect(state.board[0][4]?.type).toBe('general')
  })

  it('blocks horse moves by the horse leg', () => {
    const state = stateWith(
      [4, 9, piece('rg', 'red', 'general')],
      [4, 0, piece('bg', 'black', 'general')],
      [4, 4, piece('h', 'red', 'horse')],
      [4, 3, piece('block', 'red', 'soldier')],
    )
    const moves = getLegalMoves(state, { file: 4, rank: 4 })
    expect(moves.some((move) => move.to.file === 3 && move.to.rank === 2)).toBe(false)
    const runeState = applyDraftRune(state, 'red', 'untamed-horse')
    expect(getLegalMoves(runeState, { file: 4, rank: 4 }).some((move) => move.to.file === 3 && move.to.rank === 2)).toBe(true)
  })

  it('enforces elephant eye and river rules', () => {
    const state = stateWith(
      [4, 9, piece('rg', 'red', 'general')],
      [4, 0, piece('bg', 'black', 'general')],
      [2, 9, piece('e', 'red', 'elephant')],
      [3, 8, piece('eye', 'red', 'soldier')],
    )
    expect(getLegalMoves(state, { file: 2, rank: 9 }).some((move) => move.to.file === 4 && move.to.rank === 7)).toBe(false)
    setPieceAt(state.board, { file: 3, rank: 8 }, null)
    expect(getLegalMoves(state, { file: 2, rank: 9 }).some((move) => move.to.file === 4 && move.to.rank === 7)).toBe(true)
    setPieceAt(state.board, { file: 4, rank: 7 }, piece('e2', 'red', 'elephant'))
    expect(getLegalMoves(state, { file: 4, rank: 7 }).some((move) => move.to.rank === 5)).toBe(false)
  })

  it('handles cannon screens and mechanical first shot', () => {
    const state = stateWith(
      [4, 9, piece('rg', 'red', 'general')],
      [4, 0, piece('bg', 'black', 'general')],
      [4, 5, piece('block', 'red', 'soldier')],
      [1, 7, piece('c', 'red', 'cannon')],
      [1, 3, piece('target', 'black', 'soldier')],
    )
    expect(getLegalMoves(state, { file: 1, rank: 7 }).some((move) => move.to.rank === 3)).toBe(false)
    const runeState = applyDraftRune(state, 'red', 'mechanical-cannon')
    expect(getLegalMoves(runeState, { file: 1, rank: 7 }).some((move) => move.to.rank === 3)).toBe(true)
  })

  it('prevents generals from facing each other', () => {
    const state = stateWith(
      [4, 9, piece('rg', 'red', 'general')],
      [4, 0, piece('bg', 'black', 'general')],
      [4, 5, piece('block', 'red', 'chariot')],
    )
    const moves = getLegalMoves(state, { file: 4, rank: 5 })
    expect(moves.every((move) => move.to.file === 4)).toBe(true)
  })

  it('detects checkmate-like terminal states', () => {
    const state = stateWith(
      [4, 9, piece('rg', 'red', 'general')],
      [4, 0, piece('bg', 'black', 'general')],
      [3, 1, piece('r1', 'red', 'chariot')],
      [5, 1, piece('r2', 'red', 'chariot')],
      [4, 2, piece('r3', 'red', 'chariot')],
    )
    state.turn = 'black'
    expect(isInCheck(state, 'black')).toBe(true)
    expect(getGameStatus(state).result).toBe('checkmate')
  })
})

describe('runes and AI', () => {
  it('generates a mirrored draft pool and respects budget', () => {
    const pool = generateDraftPool(42)
    expect(pool).toHaveLength(8)
    const state = createInitialState()
    let next = state
    for (const rune of pool.slice(0, RUNE_SLOTS)) next = applyDraftRune(next, 'red', rune.id)
    expect(next.players.red.budgetUsed).toBeLessThanOrEqual(RUNE_BUDGET)
  })

  it('returns a legal AI move', () => {
    const state = createInitialState()
    state.phase = 'playing'
    state.turn = 'red'
    const move = chooseAiMove(state, 'easy')
    expect(move).toBeTruthy()
    expect(allLegalMoves(state).some((legal) => legal.notation === move?.notation)).toBe(true)
    if (move) expect(applyMove(state, move).turn).toBe('black')
  })

  it('exports Xiangqi FEN for Fairy-Stockfish', () => {
    const state = createInitialState()
    state.phase = 'playing'
    state.turn = 'black'
    expect(toXiangqiFen(state)).toBe('rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b - - 0 1')
  })
})
