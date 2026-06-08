import {
  BOARD_FILES,
  BOARD_RANKS,
  allLegalMoves,
  type Color,
  type GameState,
  type Move,
  type Piece,
  type PieceType,
} from '../engine'
import type { AiDifficulty } from './minimax'

interface EngineInstance {
  postMessage(command: string): void
  addMessageListener(listener: (line: string) => void): void
  removeMessageListener(listener: (line: string) => void): void
}

declare global {
  interface Window {
    Stockfish?: () => Promise<EngineInstance>
  }
}

const pieceToFen: Record<Color, Record<PieceType, string>> = {
  red: {
    general: 'K',
    advisor: 'A',
    elephant: 'B',
    horse: 'N',
    chariot: 'R',
    cannon: 'C',
    soldier: 'P',
  },
  black: {
    general: 'k',
    advisor: 'a',
    elephant: 'b',
    horse: 'n',
    chariot: 'r',
    cannon: 'c',
    soldier: 'p',
  },
}

const fileLetters = 'abcdefghi'

let enginePromise: Promise<EngineInstance> | null = null
let readyPromise: Promise<void> | null = null
let scriptPromise: Promise<void> | null = null

export function canUseFairyStockfish() {
  return typeof window !== 'undefined' && typeof SharedArrayBuffer !== 'undefined'
}

function pieceFen(piece: Piece) {
  return pieceToFen[piece.color][piece.type]
}

export function toXiangqiFen(state: GameState) {
  const ranks: string[] = []
  for (let rank = 0; rank < BOARD_RANKS; rank += 1) {
    let empty = 0
    let row = ''
    for (let file = 0; file < BOARD_FILES; file += 1) {
      const piece = state.board[rank][file]
      if (!piece) {
        empty += 1
      } else {
        if (empty) row += String(empty)
        empty = 0
        row += pieceFen(piece)
      }
    }
    if (empty) row += String(empty)
    ranks.push(row)
  }
  return `${ranks.join('/')} ${state.turn === 'red' ? 'w' : 'b'} - - 0 ${state.moveNumber}`
}

function uciToMove(state: GameState, bestmove: string): Move | null {
  const match = bestmove.match(/^([a-i])(10|[1-9])([a-i])(10|[1-9])/)
  if (!match) return null
  const from = {
    file: fileLetters.indexOf(match[1]),
    rank: 10 - Number(match[2]),
  }
  const to = {
    file: fileLetters.indexOf(match[3]),
    rank: 10 - Number(match[4]),
  }
  return allLegalMoves(state).find((move) => move.from.file === from.file && move.from.rank === from.rank && move.to.file === to.file && move.to.rank === to.rank) ?? null
}

async function loadEngine() {
  if (!enginePromise) {
    enginePromise = loadStockfishScript().then(async () => {
      if (!window.Stockfish) throw new Error('Fairy-Stockfish script did not expose Stockfish')
      return window.Stockfish()
    })
  }
  return enginePromise
}

function loadStockfishScript() {
  if (window.Stockfish) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = '/fairy-stockfish/stockfish.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Fairy-Stockfish script'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

function waitForLine(engine: EngineInstance, predicate: (line: string) => boolean, timeoutMs: number) {
  return new Promise<string>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      engine.removeMessageListener(listener)
      reject(new Error('Fairy-Stockfish timed out'))
    }, timeoutMs)
    const listener = (line: string) => {
      if (predicate(line)) {
        window.clearTimeout(timer)
        engine.removeMessageListener(listener)
        resolve(line)
      }
    }
    engine.addMessageListener(listener)
  })
}

async function ensureReady(engine: EngineInstance) {
  if (!readyPromise) {
    readyPromise = (async () => {
      engine.postMessage('uci')
      await waitForLine(engine, (line) => line === 'uciok', 5000)
      engine.postMessage('setoption name UCI_Variant value xiangqi')
      engine.postMessage('setoption name Threads value 1')
      engine.postMessage('isready')
      await waitForLine(engine, (line) => line === 'readyok', 5000)
    })()
  }
  return readyPromise
}

const searchTimeByDifficulty: Record<AiDifficulty, number> = {
  easy: 180,
  normal: 420,
  hard: 900,
}

export async function chooseFairyStockfishMove(state: GameState, difficulty: AiDifficulty): Promise<Move | null> {
  if (!canUseFairyStockfish()) return null
  const engine = await loadEngine()
  await ensureReady(engine)
  engine.postMessage('ucinewgame')
  engine.postMessage(`position fen ${toXiangqiFen(state)}`)
  engine.postMessage(`go movetime ${searchTimeByDifficulty[difficulty]}`)
  const line = await waitForLine(engine, (message) => message.startsWith('bestmove '), searchTimeByDifficulty[difficulty] + 5000)
  const best = line.split(/\s+/)[1]
  return uciToMove(state, best)
}
