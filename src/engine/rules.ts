import {
  BOARD_FILES,
  BOARD_RANKS,
  MAX_ENERGY,
  cloneState,
  getPieceAt,
  inBounds,
  opposite,
  pieceLabels,
  sameSquare,
  setPieceAt,
  squareKey,
} from './board'
import type { Color, GameState, Move, Piece, Square } from './types'

const orthogonal = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
]

function palace(color: Color, square: Square) {
  const ranks = color === 'red' ? [7, 8, 9] : [0, 1, 2]
  return square.file >= 3 && square.file <= 5 && ranks.includes(square.rank)
}

function crossedRiver(color: Color, rank: number) {
  return color === 'red' ? rank <= 4 : rank >= 5
}

function makeMove(state: GameState, from: Square, to: Square, piece: Piece): Move {
  const captured = getPieceAt(state, to) ?? undefined
  const notation = `${pieceLabels[piece.color][piece.type]} ${from.file},${from.rank} → ${to.file},${to.rank}`
  return { from, to, piece, captured, notation }
}

function pushIfAvailable(state: GameState, from: Square, to: Square, piece: Piece, moves: Move[]) {
  if (!inBounds(to)) return
  const target = getPieceAt(state, to)
  if (!target || target.color !== piece.color) moves.push(makeMove(state, from, to, piece))
}

function rayMoves(state: GameState, from: Square, piece: Piece, cannon = false): Move[] {
  const moves: Move[] = []
  for (const [df, dr] of orthogonal) {
    let screenSeen = false
    for (let step = 1; step < Math.max(BOARD_FILES, BOARD_RANKS); step += 1) {
      const to = { file: from.file + df * step, rank: from.rank + dr * step }
      if (!inBounds(to)) break
      const target = getPieceAt(state, to)
      if (!cannon) {
        if (!target) moves.push(makeMove(state, from, to, piece))
        else {
          if (target.color !== piece.color) moves.push(makeMove(state, from, to, piece))
          break
        }
      } else if (!screenSeen) {
        if (!target) moves.push(makeMove(state, from, to, piece))
        else {
          const mechanicalFirstShot =
            piece.color !== target.color &&
            state.players[piece.color].runes.includes('mechanical-cannon') &&
            !state.history.some((record) => record.piece.id === piece.id && record.captured)
          if (mechanicalFirstShot) moves.push(makeMove(state, from, to, piece))
          screenSeen = true
        }
      } else if (target) {
        if (target.color !== piece.color) moves.push(makeMove(state, from, to, piece))
        break
      }
    }
  }
  return moves
}

export function getPseudoMoves(state: GameState, from: Square): Move[] {
  const piece = getPieceAt(state, from)
  if (!piece) return []
  let moves: Move[] = []

  if (piece.type === 'chariot') moves = rayMoves(state, from, piece)
  if (piece.type === 'cannon') moves = rayMoves(state, from, piece, true)

  if (piece.type === 'general') {
    for (const [df, dr] of orthogonal) {
      const to = { file: from.file + df, rank: from.rank + dr }
      if (palace(piece.color, to)) pushIfAvailable(state, from, to, piece, moves)
    }
  }

  if (piece.type === 'advisor') {
    for (const [df, dr] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const to = { file: from.file + df, rank: from.rank + dr }
      if (palace(piece.color, to)) pushIfAvailable(state, from, to, piece, moves)
    }
  }

  if (piece.type === 'elephant') {
    for (const [df, dr] of [
      [2, 2],
      [2, -2],
      [-2, 2],
      [-2, -2],
    ]) {
      const eye = { file: from.file + df / 2, rank: from.rank + dr / 2 }
      const to = { file: from.file + df, rank: from.rank + dr }
      const riftFiles = state.modifiers.elephantRiftFiles[piece.color] ?? []
      const riverOk =
        piece.color === 'red' ? to.rank >= 5 || riftFiles.includes(to.file) : to.rank <= 4 || riftFiles.includes(to.file)
      if (riverOk && !getPieceAt(state, eye)) pushIfAvailable(state, from, to, piece, moves)
    }
  }

  if (piece.type === 'horse') {
    const jumps = [
      { df: 1, dr: 2, leg: { file: 0, rank: 1 } },
      { df: -1, dr: 2, leg: { file: 0, rank: 1 } },
      { df: 1, dr: -2, leg: { file: 0, rank: -1 } },
      { df: -1, dr: -2, leg: { file: 0, rank: -1 } },
      { df: 2, dr: 1, leg: { file: 1, rank: 0 } },
      { df: 2, dr: -1, leg: { file: 1, rank: 0 } },
      { df: -2, dr: 1, leg: { file: -1, rank: 0 } },
      { df: -2, dr: -1, leg: { file: -1, rank: 0 } },
    ]
    for (const jump of jumps) {
      const ignoresLeg = state.players[piece.color].runes.includes('untamed-horse')
      const leg = { file: from.file + jump.leg.file, rank: from.rank + jump.leg.rank }
      const to = { file: from.file + jump.df, rank: from.rank + jump.dr }
      if ((ignoresLeg || !getPieceAt(state, leg)) && inBounds(to)) pushIfAvailable(state, from, to, piece, moves)
    }
  }

  if (piece.type === 'soldier') {
    const forward = piece.color === 'red' ? -1 : 1
    pushIfAvailable(state, from, { file: from.file, rank: from.rank + forward }, piece, moves)
    if (crossedRiver(piece.color, from.rank)) {
      pushIfAvailable(state, from, { file: from.file - 1, rank: from.rank }, piece, moves)
      pushIfAvailable(state, from, { file: from.file + 1, rank: from.rank }, piece, moves)
      if (state.players[piece.color].runes.includes('reverse-soldier')) {
        pushIfAvailable(state, from, { file: from.file, rank: from.rank - forward }, piece, moves)
      }
    }
  }

  if (state.hooks?.modifyPseudoMoves) {
    moves = state.hooks.modifyPseudoMoves(state, piece, from, moves)
  }
  return withPortalMoves(state, moves)
}

function withPortalMoves(state: GameState, moves: Move[]) {
  const result = [...moves]
  for (const move of moves) {
    for (const portal of state.modifiers.portals) {
      const exit = sameSquare(move.to, portal.a) ? portal.b : sameSquare(move.to, portal.b) ? portal.a : null
      if (exit && !getPieceAt(state, exit)) {
        result.push({ ...move, to: exit, notation: `${move.notation} 经传送门` })
      }
    }
  }
  return result
}

function findGeneral(state: GameState, color: Color): Square | null {
  for (let rank = 0; rank < BOARD_RANKS; rank += 1) {
    for (let file = 0; file < BOARD_FILES; file += 1) {
      const piece = state.board[rank][file]
      if (piece?.color === color && piece.type === 'general') return { file, rank }
    }
  }
  return null
}

function generalsFace(state: GameState) {
  const red = findGeneral(state, 'red')
  const black = findGeneral(state, 'black')
  if (!red || !black || red.file !== black.file) return false
  const min = Math.min(red.rank, black.rank)
  const max = Math.max(red.rank, black.rank)
  for (let rank = min + 1; rank < max; rank += 1) {
    if (state.board[rank][red.file]) return false
  }
  return true
}

function attacksSquare(state: GameState, from: Square, target: Square) {
  return getPseudoMoves({ ...state, hooks: undefined }, from).some((move) => sameSquare(move.to, target))
}

export function isInCheck(state: GameState, color: Color): boolean {
  const general = findGeneral(state, color)
  if (!general) return true
  if (generalsFace(state)) return true
  for (let rank = 0; rank < BOARD_RANKS; rank += 1) {
    for (let file = 0; file < BOARD_FILES; file += 1) {
      const piece = state.board[rank][file]
      if (piece && piece.color !== color && attacksSquare(state, { file, rank }, general)) return true
    }
  }
  return false
}

export function applyMove(state: GameState, move: Move): GameState {
  let next = cloneState(state)
  if (next.hooks?.beforeApplyMove) next = next.hooks.beforeApplyMove(next, move)
  const moving = getPieceAt(next, move.from)
  if (!moving) return state
  const captured = getPieceAt(next, move.to)
  setPieceAt(next.board, move.from, null)
  if (captured?.shield && captured.shield > 0) {
    setPieceAt(next.board, move.to, { ...captured, shield: captured.shield - 1 })
    next.message = '护盾吸收了这次击破。'
  } else {
    setPieceAt(next.board, move.to, moving)
    if (captured) {
      next.players[moving.color].captured.push(captured)
      if (next.players[moving.color].runes.includes('rally-call')) {
        next.players[moving.color].energy = Math.min(MAX_ENERGY, next.players[moving.color].energy + 1)
      }
    }
  }
  next.history = [...next.history, { ...move, captured: captured ?? undefined, turn: state.turn, stateBefore: state }]
  next.turn = opposite(state.turn)
  next.moveNumber = state.turn === 'black' ? state.moveNumber + 1 : state.moveNumber
  next.players[next.turn].energy = Math.min(MAX_ENERGY, next.players[next.turn].energy + 1)
  if (next.hooks?.afterApplyMove) next = next.hooks.afterApplyMove(next, move)
  if (next.hooks?.onTurnStart) next = next.hooks.onTurnStart(next, next.turn)
  return next
}

function leavesOwnGeneralSafe(state: GameState, move: Move) {
  const next = applyMove({ ...state, hooks: undefined }, move)
  return !isInCheck(next, move.piece.color)
}

export function getLegalMoves(state: GameState, square: Square): Move[] {
  const piece = getPieceAt(state, square)
  if (!piece || piece.color !== state.turn || state.phase === 'ended') return []
  const seen = new Set<string>()
  return getPseudoMoves(state, square)
    .filter((move) => leavesOwnGeneralSafe(state, move))
    .filter((move) => {
      const key = `${squareKey(move.from)}-${squareKey(move.to)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export function allLegalMoves(state: GameState, color = state.turn): Move[] {
  const scoped = { ...state, turn: color }
  const moves: Move[] = []
  for (let rank = 0; rank < BOARD_RANKS; rank += 1) {
    for (let file = 0; file < BOARD_FILES; file += 1) {
      const piece = scoped.board[rank][file]
      if (piece?.color === color) moves.push(...getLegalMoves(scoped, { file, rank }))
    }
  }
  return moves
}
