export type Color = 'red' | 'black'
export type PieceType =
  | 'general'
  | 'advisor'
  | 'elephant'
  | 'horse'
  | 'chariot'
  | 'cannon'
  | 'soldier'

export type GamePhase = 'draft' | 'playing' | 'ended'
export type GameResult = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw' | 'resigned'

export interface Square {
  file: number
  rank: number
}

export interface Piece {
  id: string
  color: Color
  type: PieceType
  shield?: number
}

export interface Move {
  from: Square
  to: Square
  piece: Piece
  captured?: Piece
  notation: string
  isRuneMove?: boolean
}

export interface MoveRecord extends Move {
  turn: Color
  stateBefore: GameState
}

export interface PlayerState {
  energy: number
  runes: string[]
  captured: Piece[]
  budgetUsed: number
}

export interface PortalPair {
  a: Square
  b: Square
}

export interface BoardModifierState {
  portals: PortalPair[]
  elephantRiftFiles: Partial<Record<Color, number[]>>
}

export interface EngineHooks {
  modifyPseudoMoves?: (state: GameState, piece: Piece, from: Square, moves: Move[]) => Move[]
  beforeApplyMove?: (state: GameState, move: Move) => GameState
  afterApplyMove?: (state: GameState, move: Move) => GameState
  onTurnStart?: (state: GameState, color: Color) => GameState
}

export interface GameState {
  board: (Piece | null)[][]
  turn: Color
  moveNumber: number
  players: Record<Color, PlayerState>
  modifiers: BoardModifierState
  hooks?: EngineHooks
  history: MoveRecord[]
  phase: GamePhase
  winner?: Color
  result: GameResult
  message: string
}

export interface GameStatus {
  result: GameResult
  winner?: Color
  inCheck: boolean
  legalMoveCount: number
  message: string
}
