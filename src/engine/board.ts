import type { Color, GameState, Piece, PieceType, Square } from './types'

export const BOARD_FILES = 9
export const BOARD_RANKS = 10
export const MAX_ENERGY = 10

export const pieceLabels: Record<Color, Record<PieceType, string>> = {
  red: {
    general: '帅',
    advisor: '仕',
    elephant: '相',
    horse: '傌',
    chariot: '俥',
    cannon: '砲',
    soldier: '兵',
  },
  black: {
    general: '将',
    advisor: '士',
    elephant: '象',
    horse: '马',
    chariot: '车',
    cannon: '炮',
    soldier: '卒',
  },
}

export const opposite = (color: Color): Color => (color === 'red' ? 'black' : 'red')
export const sameSquare = (a: Square, b: Square) => a.file === b.file && a.rank === b.rank
export const squareKey = (square: Square) => `${square.file},${square.rank}`
export const inBounds = ({ file, rank }: Square) =>
  file >= 0 && file < BOARD_FILES && rank >= 0 && rank < BOARD_RANKS
export const cloneSquare = (square: Square): Square => ({ file: square.file, rank: square.rank })

export function createEmptyBoard(): (Piece | null)[][] {
  return Array.from({ length: BOARD_RANKS }, () => Array.from({ length: BOARD_FILES }, () => null))
}

export function clonePiece(piece: Piece): Piece {
  return { ...piece }
}

export function cloneBoard(board: (Piece | null)[][]): (Piece | null)[][] {
  return board.map((rank) => rank.map((piece) => (piece ? clonePiece(piece) : null)))
}

export function getPieceAt(state: GameState, square: Square): Piece | null {
  if (!inBounds(square)) return null
  return state.board[square.rank][square.file]
}

export function setPieceAt(board: (Piece | null)[][], square: Square, piece: Piece | null) {
  if (inBounds(square)) board[square.rank][square.file] = piece
}

function piece(color: Color, type: PieceType, file: number, rank: number): [Square, Piece] {
  return [{ file, rank }, { id: `${color}-${type}-${file}-${rank}`, color, type }]
}

export function createInitialState(): GameState {
  const board = createEmptyBoard()
  const placements: [Square, Piece][] = [
    piece('black', 'chariot', 0, 0),
    piece('black', 'horse', 1, 0),
    piece('black', 'elephant', 2, 0),
    piece('black', 'advisor', 3, 0),
    piece('black', 'general', 4, 0),
    piece('black', 'advisor', 5, 0),
    piece('black', 'elephant', 6, 0),
    piece('black', 'horse', 7, 0),
    piece('black', 'chariot', 8, 0),
    piece('black', 'cannon', 1, 2),
    piece('black', 'cannon', 7, 2),
    piece('black', 'soldier', 0, 3),
    piece('black', 'soldier', 2, 3),
    piece('black', 'soldier', 4, 3),
    piece('black', 'soldier', 6, 3),
    piece('black', 'soldier', 8, 3),
    piece('red', 'chariot', 0, 9),
    piece('red', 'horse', 1, 9),
    piece('red', 'elephant', 2, 9),
    piece('red', 'advisor', 3, 9),
    piece('red', 'general', 4, 9),
    piece('red', 'advisor', 5, 9),
    piece('red', 'elephant', 6, 9),
    piece('red', 'horse', 7, 9),
    piece('red', 'chariot', 8, 9),
    piece('red', 'cannon', 1, 7),
    piece('red', 'cannon', 7, 7),
    piece('red', 'soldier', 0, 6),
    piece('red', 'soldier', 2, 6),
    piece('red', 'soldier', 4, 6),
    piece('red', 'soldier', 6, 6),
    piece('red', 'soldier', 8, 6),
  ]

  placements.forEach(([square, placedPiece]) => setPieceAt(board, square, placedPiece))

  return {
    board,
    turn: 'red',
    moveNumber: 1,
    players: {
      red: { energy: 0, runes: [], captured: [], budgetUsed: 0 },
      black: { energy: 0, runes: [], captured: [], budgetUsed: 0 },
    },
    modifiers: { portals: [], elephantRiftFiles: { red: [], black: [] }, chronoStorm: false },
    history: [],
    phase: 'draft',
    result: 'playing',
    message: '征召海克斯符文，随后开局。',
  }
}

export function cloneState(state: GameState): GameState {
  return {
    ...state,
    board: cloneBoard(state.board),
    players: {
      red: {
        ...state.players.red,
        runes: [...state.players.red.runes],
        captured: state.players.red.captured.map(clonePiece),
      },
      black: {
        ...state.players.black,
        runes: [...state.players.black.runes],
        captured: state.players.black.captured.map(clonePiece),
      },
    },
    modifiers: {
      portals: state.modifiers.portals.map((portal) => ({
        a: cloneSquare(portal.a),
        b: cloneSquare(portal.b),
      })),
      elephantRiftFiles: {
        red: [...(state.modifiers.elephantRiftFiles.red ?? [])],
        black: [...(state.modifiers.elephantRiftFiles.black ?? [])],
      },
      chronoStorm: state.modifiers.chronoStorm,
    },
    history: [...state.history],
  }
}
