import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import clsx from 'clsx'
import {
  BOARD_FILES,
  BOARD_RANKS,
  getPieceAt,
  pieceLabels,
  sameSquare,
  squareKey,
  type Color,
  type Square,
} from './engine'
import { coreAugmentById, runeById, runes } from './runes'
import { useGameStore, type GameMode } from './store/gameStore'
import './index.css'

const colorLabel: Record<Color, string> = { red: '红方', black: '黑方' }
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
const rarityClass = {
  silver: 'border-slate-300/70 from-slate-200/20',
  gold: 'border-hexgold/80 from-hexgold/25',
  prismatic: 'border-fuchsia-300/80 from-fuchsia-500/20',
}

function squareName(square: Square) {
  return `${square.file + 1}-${square.rank + 1}`
}

function PlayerPanel({ color }: { color: Color }) {
  const state = useGameStore((store) => store.state)
  const player = state.players[color]
  return (
    <section
      className={clsx(
        'hex-panel rounded-lg p-4',
        state.turn === color && state.phase === 'playing' && 'shadow-glow border-hexcyan/70',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={assetUrl(`/assets/branding/${color}-avatar.svg`)}
            alt={`${colorLabel[color]}阵营印`}
            className="h-12 w-12 rounded-full border border-hexgold/60"
          />
          <div>
            <h2 className="font-display text-lg text-parchment">{colorLabel[color]}</h2>
            <p className="text-sm text-parchment/60">{player.runes.length}/3 机策 · {player.budgetUsed}/9 点</p>
          </div>
        </div>
        <div className="text-right font-display text-2xl text-hexcyan">{player.energy}</div>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full border border-hexcyan/30 bg-black/35">
        <motion.div
          className="h-full bg-gradient-to-r from-hexblue via-hexcyan to-hexgold"
          animate={{ width: `${(player.energy / 10) * 100}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {player.coreAugment && (
          <span className="rounded border border-fuchsia-300/50 px-2 py-1 text-xs text-fuchsia-100">
            {coreAugmentById[player.coreAugment]?.name}
          </span>
        )}
        {player.runes.map((id) => (
          <span key={id} className="rounded border border-hexgold/35 px-2 py-1 text-xs text-parchment/80">
            {runeById[id]?.name}
          </span>
        ))}
      </div>
    </section>
  )
}

function DraftScreen() {
  const { state, draftPool, corePool, draftStage, draftTurn, pickRune, pickCoreAugment, advanceDraftIfBlocked } =
    useGameStore()

  useEffect(() => {
    advanceDraftIfBlocked()
  }, [advanceDraftIfBlocked, draftPool, draftStage, draftTurn, state])

  return (
    <section className="hex-panel rounded-lg p-4 lg:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.24em] text-hexcyan">
            {draftStage === 'core' ? 'TIANGONG STATECRAFT' : 'CHU-HAN STRATAGEMS'}
          </p>
          <h2 className="font-display text-3xl text-parchment">
            {draftStage === 'core' ? '天工国策三选一' : '兵书机策征召'}
          </h2>
        </div>
        <p className="text-parchment/70">
          当前执策：<span className="text-hexgold">{colorLabel[draftTurn]}</span>
        </p>
      </div>
      {draftStage === 'core' ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {corePool.map((augment) => {
            const takenBy = (['red', 'black'] as const).find((color) => state.players[color].coreAugment === augment.id)
            const disabled = Boolean(state.players[draftTurn].coreAugment)
            return (
              <motion.button
                key={augment.id}
                type="button"
                disabled={disabled}
                onClick={() => pickCoreAugment(augment.id)}
                whileHover={{ y: disabled ? 0 : -3 }}
                className="min-h-64 rounded-lg border border-hexgold/70 bg-gradient-to-br from-hexgold/20 via-hexcyan/10 to-crimson/10 p-5 text-left shadow-gold disabled:opacity-45"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl text-parchment">{augment.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-fuchsia-200">
                      国策 · {augment.risk}
                    </p>
                  </div>
                  <span className="rounded border border-hexgold/60 px-2 py-1 text-sm text-hexgold">国策</span>
                </div>
                <p className="mt-4 text-base text-parchment/90">{augment.description}</p>
                <p className="mt-4 rounded border border-hexcyan/25 bg-black/20 p-3 text-sm text-hexcyan/85">
                  {augment.balance}
                </p>
                <p className="mt-4 text-sm italic text-parchment/55">{augment.flavor}</p>
                {takenBy && <p className="mt-4 text-sm text-hexgold">{colorLabel[takenBy]}已立策</p>}
              </motion.button>
            )
          })}
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {draftPool.map((rune) => {
            const takenBy = (['red', 'black'] as const).find((color) => state.players[color].runes.includes(rune.id))
            const affordable =
              !takenBy &&
              state.players[draftTurn].runes.length < 3 &&
              state.players[draftTurn].budgetUsed + rune.points <= 9
            return (
              <motion.button
                key={rune.id}
                type="button"
                disabled={!affordable}
                onClick={() => pickRune(rune.id)}
                whileHover={{ rotateX: affordable ? 4 : 0 }}
                className={clsx(
                  'min-h-48 rounded-lg border bg-gradient-to-br p-4 text-left transition',
                  rarityClass[rune.rarity],
                  affordable ? 'hover:shadow-gold' : 'opacity-45',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl text-parchment">{rune.name}</h3>
                    <p className="text-xs uppercase tracking-[0.22em] text-hexcyan">{rune.rarity}</p>
                  </div>
                  <span className="rounded border border-hexgold/50 px-2 py-1 text-sm text-hexgold">{rune.points}</span>
                </div>
                <p className="mt-3 text-sm text-parchment/80">{rune.description}</p>
                <p className="mt-3 text-xs italic text-parchment/50">{rune.flavor}</p>
                {takenBy && <p className="mt-3 text-sm text-hexgold">已由{colorLabel[takenBy]}取策</p>}
              </motion.button>
            )
          })}
        </div>
      )}
    </section>
  )
}

function Board() {
  const state = useGameStore((store) => store.state)
  const selected = useGameStore((store) => store.selected)
  const legalMoves = useGameStore((store) => store.legalMoves)
  const activeRune = useGameStore((store) => store.activeRune)
  const clickSquare = useGameStore((store) => store.clickSquare)
  const legalTargets = new Set(legalMoves.map((move) => squareKey(move.to)))
  const lastMove = state.history.at(-1)
  const captureEffect = lastMove?.captured ? lastMove : null
  const checkEffect = state.result === 'check' || state.result === 'checkmate'
  const pointStyle = (square: Square) => ({
    left: `${(square.file / (BOARD_FILES - 1)) * 100}%`,
    top: `${(square.rank / (BOARD_RANKS - 1)) * 100}%`,
  })

  return (
    <section className="hex-panel board-grid rounded-lg p-3">
      <div className="relative mx-auto aspect-[9/10] w-full max-w-[min(88vw,620px)] rounded-md border border-hexgold/50 bg-[#102033] p-[clamp(18px,4.2vw,38px)]">
        <div className="relative h-full w-full">
          <div className="pointer-events-none absolute inset-0">
            {Array.from({ length: BOARD_RANKS }).map((_, rank) => (
              <span
                key={`h-${rank}`}
                className="absolute left-0 h-px w-full bg-hexcyan/45 shadow-[0_0_10px_rgba(10,200,185,0.22)]"
                style={{ top: `${(rank / (BOARD_RANKS - 1)) * 100}%` }}
              />
            ))}
            {Array.from({ length: BOARD_FILES }).map((_, file) => {
              const left = `${(file / (BOARD_FILES - 1)) * 100}%`
              const isEdge = file === 0 || file === BOARD_FILES - 1
              return isEdge ? (
                <span
                  key={`v-${file}`}
                  className="absolute top-0 h-full w-px bg-hexcyan/45 shadow-[0_0_10px_rgba(10,200,185,0.22)]"
                  style={{ left }}
                />
              ) : (
                <span key={`v-${file}`} className="absolute top-0 h-full w-px" style={{ left }}>
                  <span className="absolute top-0 block h-[44.5%] w-px bg-hexcyan/45 shadow-[0_0_10px_rgba(10,200,185,0.22)]" />
                  <span className="absolute bottom-0 block h-[44.5%] w-px bg-hexcyan/45 shadow-[0_0_10px_rgba(10,200,185,0.22)]" />
                </span>
              )
            })}
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 8 9" preserveAspectRatio="none">
              <path d="M3 0 L5 2 M5 0 L3 2 M3 7 L5 9 M5 7 L3 9" stroke="rgba(200,170,110,.55)" strokeWidth="0.035" />
            </svg>
            <div className="absolute left-0 right-0 top-1/2 flex -translate-y-1/2 justify-center gap-[18%] bg-[#102033]/85 py-1 font-display text-sm tracking-[0.3em] text-hexgold/65">
              <span>楚河</span>
              <span>汉界</span>
            </div>
          </div>
          {Array.from({ length: BOARD_RANKS }).flatMap((_, rank) =>
            Array.from({ length: BOARD_FILES }).map((__, file) => {
              const square = { file, rank }
              const piece = getPieceAt(state, square)
              const isSelected = selected && sameSquare(selected, square)
              const isLegal = legalTargets.has(squareKey(square))
              const isPortal = state.modifiers.portals.some((portal) => sameSquare(portal.a, square) || sameSquare(portal.b, square))
              return (
                <button
                  key={squareKey(square)}
                  type="button"
                  aria-label={squareName(square)}
                  onClick={() => clickSquare(square)}
                  style={pointStyle(square)}
                  className={clsx(
                    'absolute z-10 flex h-[clamp(34px,8.8vw,58px)] w-[clamp(34px,8.8vw,58px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full',
                    'focus:outline-none focus:ring-2 focus:ring-hexgold/80',
                    isSelected && 'ring-2 ring-hexgold shadow-gold',
                    activeRune && 'cursor-crosshair',
                  )}
                >
                  {isPortal && <span className="absolute h-7 w-7 rounded-full border border-hexcyan/70 shadow-glow" />}
                  {isLegal && <span className="absolute h-4 w-4 rounded-full bg-hexcyan/60 shadow-glow" />}
                  <AnimatePresence>
                    {piece && (
                      <motion.span
                        layoutId={piece.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        className={clsx(
                          'z-10 flex h-[92%] w-[92%] items-center justify-center rounded-full border text-[clamp(1rem,4vw,2rem)] font-bold shadow-lg',
                          piece.color === 'red'
                            ? 'border-crimson/80 bg-[#2a1118] text-red-100 shadow-red-950'
                            : 'border-hexcyan/80 bg-[#071827] text-cyan-100 shadow-cyan-950',
                        )}
                      >
                        {pieceLabels[piece.color][piece.type]}
                        {piece.shield ? (
                          <span className="absolute -right-1 -top-1 rounded-full bg-hexgold px-1 text-xs text-void">
                            {piece.shield}
                          </span>
                        ) : null}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              )
            }),
          )}
          <AnimatePresence>
            {captureEffect && (
              <motion.div
                key={`${captureEffect.notation}-${state.history.length}`}
                className="pointer-events-none absolute z-30 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-hexgold/80 bg-hexgold/15 text-sm font-bold text-hexgold shadow-gold"
                style={pointStyle(captureEffect.to)}
                initial={{ scale: 0.45, opacity: 0, rotate: -18 }}
                animate={{ scale: [0.55, 1.35, 1], opacity: [0, 1, 0], rotate: 8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              >
                斩获
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {checkEffect && (
              <motion.div
                key={`check-${state.history.length}-${state.result}`}
                className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded border border-crimson/80 bg-[#2a1118]/90 px-8 py-3 font-display text-3xl text-red-100 shadow-[0_0_32px_rgba(211,75,84,0.45)]"
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.08, 1, 1], y: [8, 0, 0, -4] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.3, ease: 'easeOut' }}
              >
                将军
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function RuneHand() {
  const state = useGameStore((store) => store.state)
  const activeRune = useGameStore((store) => store.activeRune)
  const activateActiveRune = useGameStore((store) => store.activateActiveRune)
  const currentRunes = state.players[state.turn].runes.map((id) => runeById[id]).filter(Boolean)

  return (
    <section className="hex-panel rounded-lg p-4">
      <h2 className="font-display text-xl text-parchment">当前机策</h2>
      <div className="mt-3 grid gap-2">
        {currentRunes.map((rune) => (
          <button
            key={rune.id}
            type="button"
            disabled={rune.type !== 'active' || (rune.energyCost ?? 0) > state.players[state.turn].energy}
            onClick={() => activateActiveRune(rune.id)}
            className={clsx(
              'rounded border bg-gradient-to-br p-3 text-left',
              rarityClass[rune.rarity],
              activeRune === rune.id && 'shadow-glow',
            )}
          >
            <div className="flex justify-between gap-3">
              <span className="font-display text-parchment">{rune.name}</span>
              <span className="text-hexgold">{rune.energyCost ? `${rune.energyCost} 势` : '常策'}</span>
            </div>
            <p className="mt-1 text-xs text-parchment/65">{rune.description}</p>
          </button>
        ))}
      </div>
      {activeRune && <p className="mt-3 text-sm text-hexcyan">选择落点以施策：{runeById[activeRune].name}</p>}
    </section>
  )
}

function Controls() {
  const { state, mode, aiDifficulty, muted, aiEngine, aiThinking, setMode, setDifficulty, startNewGame, undo, resign, toggleMute } = useGameStore()
  return (
    <section className="hex-panel rounded-lg p-4">
      <div className="grid grid-cols-2 gap-2">
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as GameMode)}
          className="rounded border border-hexcyan/40 bg-void p-2 text-parchment"
        >
          <option value="ai">人机对战</option>
          <option value="hotseat">本地双人</option>
        </select>
        <select
          value={aiDifficulty}
          onChange={(event) => setDifficulty(event.target.value as 'easy' | 'normal' | 'hard')}
          className="rounded border border-hexcyan/40 bg-void p-2 text-parchment"
        >
          <option value="easy">简单</option>
          <option value="normal">普通</option>
          <option value="hard">困难</option>
        </select>
        <button type="button" className="hex-button rounded p-2" onClick={() => startNewGame()}>
          新局
        </button>
        <button type="button" className="hex-button rounded p-2" onClick={undo} disabled={!state.history.length}>
          悔棋
        </button>
        <button type="button" className="hex-button rounded p-2" onClick={resign} disabled={state.phase !== 'playing'}>
          认输
        </button>
        <button type="button" className="hex-button rounded p-2" onClick={toggleMute}>
          {muted ? '音效关' : '音效开'}
        </button>
      </div>
      <p className="mt-4 text-sm text-parchment/60">
        可用机策：{runes.length} 卷 · AI：{aiThinking ? '推演中...' : aiEngine === 'fairy-stockfish' ? 'Fairy-Stockfish' : '内置推演'}
      </p>
    </section>
  )
}

function History() {
  const history = useGameStore((store) => store.state.history)
  return (
    <section className="hex-panel max-h-72 overflow-auto rounded-lg p-4">
      <h2 className="font-display text-xl text-parchment">走子历史</h2>
      <ol className="mt-3 space-y-1 text-sm text-parchment/70">
        {history
          .slice()
          .reverse()
          .map((move, index) => (
            <li key={`${move.notation}-${index}`} className="flex justify-between gap-3">
              <span>{colorLabel[move.turn]}</span>
              <span>{move.notation}</span>
            </li>
          ))}
      </ol>
    </section>
  )
}

function App() {
  const state = useGameStore((store) => store.state)
  const mode = useGameStore((store) => store.mode)
  const runAiTurn = useGameStore((store) => store.runAiTurn)

  useEffect(() => {
    if (mode === 'ai' && state.phase === 'playing' && state.turn === 'black') {
      const timer = window.setTimeout(runAiTurn, 360)
      return () => window.clearTimeout(timer)
    }
  }, [mode, runAiTurn, state.phase, state.turn, state.moveNumber])

  return (
    <main className="min-h-screen p-3 sm:p-5">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <header className="hex-panel flex flex-col gap-3 rounded-lg p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img src={assetUrl('/assets/branding/logo.svg')} alt="天工楚汉棋" className="h-14 w-14" />
            <div>
              <p className="font-display text-xs uppercase tracking-[0.28em] text-hexcyan">TIANGONG CHU-HAN</p>
              <h1 className="font-display text-3xl text-parchment sm:text-4xl">天工楚汉棋</h1>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="font-display text-xl text-hexgold">{state.phase === 'draft' ? '机策征召' : colorLabel[state.turn]}</p>
            <p className="text-parchment/70">{state.message}</p>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[320px_minmax(420px,1fr)_340px]">
          <aside className="flex flex-col gap-4">
            <PlayerPanel color="black" />
            <Controls />
          </aside>

          <div className="flex flex-col gap-4">
            {state.phase === 'draft' ? <DraftScreen /> : <Board />}
            {state.phase === 'ended' && (
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="hex-panel rounded-lg bg-[url('/hextech-xiangqi/assets/ui/victory.svg')] bg-cover p-6 text-center"
              >
                <p className="font-display text-3xl text-hexgold">
                  {state.winner ? `${colorLabel[state.winner]}胜利` : '对局结束'}
                </p>
                <p className="mt-2 text-parchment/70">{state.message}</p>
              </motion.section>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <PlayerPanel color="red" />
            {state.phase === 'playing' && <RuneHand />}
            <History />
          </aside>
        </div>
      </div>
    </main>
  )
}

export default App
