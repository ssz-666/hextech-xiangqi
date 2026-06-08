import { create } from 'zustand'
import {
  MAX_ENERGY,
  applyMove,
  cloneState,
  createInitialState,
  getGameStatus,
  getLegalMoves,
  getPieceAt,
  getPseudoMoves,
  isInCheck,
  opposite,
  type Color,
  type GameState,
  type Move,
  type Square,
} from '../engine'
import { chooseAiMove, maybeUseAiRune, type AiDifficulty } from '../ai/minimax'
import { chooseFairyStockfishMove } from '../ai/fairyStockfish'
import {
  DRAFT_POOL_SIZE,
  RUNE_SLOTS,
  activateRune,
  applyCoreAugment,
  applyDraftRune,
  canAffordRune,
  generateCorePool,
  generateDraftPool,
  type CoreAugmentDefinition,
  runeById,
  type RuneDefinition,
} from '../runes'

export type GameMode = 'hotseat' | 'ai'

interface GameStore {
  state: GameState
  draftPool: RuneDefinition[]
  corePool: CoreAugmentDefinition[]
  draftStage: 'core' | 'runes'
  draftTurn: Color
  picksThisTurn: number
  mode: GameMode
  aiDifficulty: AiDifficulty
  selected: Square | null
  legalMoves: Move[]
  activeRune: string | null
  muted: boolean
  aiEngine: 'fairy-stockfish' | 'minimax'
  aiThinking: boolean
  startNewGame: (mode?: GameMode) => void
  setMode: (mode: GameMode) => void
  setDifficulty: (difficulty: AiDifficulty) => void
  pickRune: (runeId: string) => void
  pickCoreAugment: (augmentId: string) => void
  advanceDraftIfBlocked: () => void
  clickSquare: (square: Square) => void
  activateActiveRune: (runeId: string) => void
  resign: () => void
  undo: () => void
  toggleMute: () => void
  runAiTurn: () => void
}

function finalizeStatus(state: GameState): GameState {
  const status = getGameStatus(state)
  return {
    ...state,
    result: status.result,
    winner: status.winner,
    message: status.message,
    phase: status.result === 'checkmate' || status.result === 'stalemate' ? 'ended' : state.phase,
  }
}

function nextDraftTurn(current: Color, picksThisTurn: number) {
  if (picksThisTurn === 0) return { draftTurn: opposite(current), picksThisTurn: 1 }
  return { draftTurn: opposite(current), picksThisTurn: 0 }
}

function bothDrafted(state: GameState) {
  return state.players.red.runes.length >= RUNE_SLOTS && state.players.black.runes.length >= RUNE_SLOTS
}

function canPickFromPool(state: GameState, pool: RuneDefinition[], color: Color) {
  return pool.some((rune) => canAffordRune(state, color, rune))
}

function beginPlaying(state: GameState): GameState {
  const next = cloneState(state)
  next.phase = 'playing'
  next.turn = 'red'
  next.players.red.energy = Math.min(MAX_ENERGY, next.players.red.energy + 1)
  if (next.players.red.coreAugment === 'dujiangyan' && next.players.red.energy <= 4) {
    next.players.red.energy = Math.min(MAX_ENERGY, next.players.red.energy + 1)
  }
  next.message = '红方先行。'
  return next
}

function advanceRuneDraft(
  state: GameState,
  pool: RuneDefinition[],
  draftTurn: Color,
  picksThisTurn: number,
): { state: GameState; draftTurn: Color; picksThisTurn: number } {
  if (bothDrafted(state)) return { state: beginPlaying(state), draftTurn, picksThisTurn }

  const redCanPick = canPickFromPool(state, pool, 'red')
  const blackCanPick = canPickFromPool(state, pool, 'black')
  if (!redCanPick && !blackCanPick) return { state: beginPlaying(state), draftTurn, picksThisTurn }

  let nextTurn = draftTurn
  let nextPicksThisTurn = picksThisTurn
  for (let guard = 0; guard < 4; guard += 1) {
    if (canPickFromPool(state, pool, nextTurn)) {
      return { state, draftTurn: nextTurn, picksThisTurn: nextPicksThisTurn }
    }
    const next = nextDraftTurn(nextTurn, nextPicksThisTurn)
    nextTurn = next.draftTurn
    nextPicksThisTurn = next.picksThisTurn
  }

  return { state: beginPlaying(state), draftTurn: nextTurn, picksThisTurn: nextPicksThisTurn }
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(),
  draftPool: generateDraftPool(Date.now(), DRAFT_POOL_SIZE),
  corePool: generateCorePool(Date.now()),
  draftStage: 'core',
  draftTurn: 'red',
  picksThisTurn: 0,
  mode: 'ai',
  aiDifficulty: 'normal',
  selected: null,
  legalMoves: [],
  activeRune: null,
  muted: false,
  aiEngine: 'minimax',
  aiThinking: false,

  startNewGame: (mode) =>
    set((current) => ({
      state: createInitialState(),
      draftPool: generateDraftPool(Date.now(), DRAFT_POOL_SIZE),
      corePool: generateCorePool(Date.now()),
      draftStage: 'core',
      draftTurn: 'red',
      picksThisTurn: 0,
      mode: mode ?? current.mode,
      selected: null,
      legalMoves: [],
      activeRune: null,
      aiThinking: false,
    })),

  setMode: (mode) => set({ mode }),
  setDifficulty: (aiDifficulty) => set({ aiDifficulty }),
  toggleMute: () => set((state) => ({ muted: !state.muted })),

  pickCoreAugment: (augmentId) => {
    const current = get()
    if (current.state.phase !== 'draft' || current.draftStage !== 'core') return
    const nextState = applyCoreAugment(current.state, current.draftTurn, augmentId)
    if (nextState === current.state) return
    const bothPicked = Boolean(nextState.players.red.coreAugment && nextState.players.black.coreAugment)
    set({
      state: nextState,
      draftStage: bothPicked ? 'runes' : 'core',
      draftTurn: bothPicked ? 'red' : opposite(current.draftTurn),
      picksThisTurn: 0,
    })
  },

  pickRune: (runeId) => {
    const current = get()
    if (current.state.phase !== 'draft' || current.draftStage !== 'runes') return
    const rune = runeById[runeId]
    if (!rune) return
    let nextState = applyDraftRune(current.state, current.draftTurn, runeId)
    if (nextState === current.state) return
    let draftTurn = current.draftTurn
    let picksThisTurn = current.picksThisTurn
    if (bothDrafted(nextState)) {
      nextState = beginPlaying(nextState)
    } else {
      const next = nextDraftTurn(current.draftTurn, current.picksThisTurn)
      draftTurn = next.draftTurn
      picksThisTurn = next.picksThisTurn
    }
    const advanced =
      nextState.phase === 'draft'
        ? advanceRuneDraft(nextState, current.draftPool, draftTurn, picksThisTurn)
        : { state: nextState, draftTurn, picksThisTurn }
    set(advanced)
  },

  advanceDraftIfBlocked: () => {
    const current = get()
    if (current.state.phase !== 'draft' || current.draftStage !== 'runes') return
    if (canPickFromPool(current.state, current.draftPool, current.draftTurn)) return
    set(advanceRuneDraft(current.state, current.draftPool, current.draftTurn, current.picksThisTurn))
  },

  clickSquare: (square) => {
    const current = get()
    const state = current.state
    if (state.phase !== 'playing') return
    if (current.aiThinking) {
      set({ state: { ...state, message: 'AI 思考中，请稍等。' } })
      return
    }

    if (current.activeRune) {
      const selected = current.selected
      const needsTwoTargets = ['chrono-swap', 'hex-teleport', 'sun-bin-feint'].includes(current.activeRune)
      if (needsTwoTargets && !selected) {
        set({
          state: { ...state, message: '已选定第一目标，请再选择第二目标。' },
          selected: square,
          legalMoves: [],
        })
        return
      }
      const nextState = activateRune(state, current.activeRune, {
        color: state.turn,
        target: selected ?? square,
        secondaryTarget: selected ? square : undefined,
      })
      set({ state: finalizeStatus(nextState), selected: null, legalMoves: [], activeRune: null })
      return
    }

    const chosenMove = current.legalMoves.find((move) => move.to.file === square.file && move.to.rank === square.rank)
    if (chosenMove) {
      set({ state: finalizeStatus(applyMove(state, chosenMove)), selected: null, legalMoves: [] })
      return
    }

    const piece = getPieceAt(state, square)
    if (piece?.color === state.turn) {
      const legalMoves = getLegalMoves(state, square)
      const pseudoMoves = getPseudoMoves(state, square)
      const message =
        legalMoves.length > 0
          ? state.message
          : pseudoMoves.length > 0 || isInCheck(state, state.turn)
            ? '这枚棋子暂时被牵制，走开会暴露将帅或无法解将。'
            : piece.type === 'horse'
              ? '这匹马暂时没有可走点：马腿、边界或己方棋子挡住了。'
              : '这枚棋子暂时没有合法走法。'
      set({ state: { ...state, message }, selected: square, legalMoves, activeRune: null })
      return
    }

    if (piece && piece.color !== state.turn) {
      set({ state: { ...state, message: `现在轮到${state.turn === 'red' ? '红方' : '黑方'}。` }, selected: null, legalMoves: [], activeRune: null })
      return
    }

    set({ selected: null, legalMoves: [], activeRune: null })
  },

  activateActiveRune: (runeId) => {
    const rune = runeById[runeId]
    if (!rune || rune.type !== 'active') return
    set({ activeRune: runeId, selected: null, legalMoves: [] })
  },

  resign: () =>
    set((current) => ({
      state: {
        ...current.state,
        phase: 'ended',
        result: 'resigned',
        winner: opposite(current.state.turn),
        message: `${current.state.turn === 'red' ? '红方' : '黑方'}认输`,
      },
      aiThinking: false,
    })),

  undo: () =>
    set((current) => {
      const last = current.state.history.at(-1)
      if (!last) return current
      return { state: last.stateBefore, selected: null, legalMoves: [], activeRune: null, aiThinking: false }
    }),

  runAiTurn: () => {
    const current = get()
    if (current.mode !== 'ai' || current.state.phase !== 'playing' || current.state.turn !== 'black') return
    const runeState = maybeUseAiRune(current.state)
    set({ aiThinking: true, state: { ...runeState, message: 'AI 思考中...' } })
    void chooseFairyStockfishMove(runeState, current.aiDifficulty)
      .then((strongMove) => {
        const latest = get()
        if (latest.mode !== 'ai' || latest.state.phase !== 'playing' || latest.state.turn !== 'black') {
          set({ aiThinking: false })
          return
        }
        const move = strongMove ?? chooseAiMove(runeState, current.aiDifficulty)
        if (!move) {
          set({ aiThinking: false })
          return
        }
        set({
          state: finalizeStatus(applyMove(runeState, move)),
          selected: null,
          legalMoves: [],
          activeRune: null,
          aiEngine: strongMove ? 'fairy-stockfish' : 'minimax',
          aiThinking: false,
        })
      })
      .catch(() => {
        const latest = get()
        if (latest.mode !== 'ai' || latest.state.phase !== 'playing' || latest.state.turn !== 'black') {
          set({ aiThinking: false })
          return
        }
        const move = chooseAiMove(runeState, current.aiDifficulty)
        if (!move) {
          set({ aiThinking: false })
          return
        }
        set({
          state: finalizeStatus(applyMove(runeState, move)),
          selected: null,
          legalMoves: [],
          activeRune: null,
          aiEngine: 'minimax',
          aiThinking: false,
        })
      })
  },
}))
