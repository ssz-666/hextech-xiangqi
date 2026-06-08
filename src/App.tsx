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
import { runeById, runes } from './runes'
import { useGameStore, type GameMode } from './store/gameStore'
import './index.css'

const colorLabel: Record<Color, string> = { red: '红方', black: '黑方' }
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
            src={`/assets/branding/${color}-avatar.svg`}
            alt={`${colorLabel[color]}头像`}
            className="h-12 w-12 rounded-full border border-hexgold/60"
          />
          <div>
            <h2 className="font-display text-lg text-parchment">{colorLabel[color]}</h2>
            <p className="text-sm text-parchment/60">{player.runes.length}/3 符文 · {player.budgetUsed}/9 点</p>
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
  const { state, draftPool, draftTurn, pickRune } = useGameStore()
  return (
    <section className="hex-panel rounded-lg p-4 lg:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.24em] text-hexcyan">Mirror Ban/Pick</p>
          <h2 className="font-display text-3xl text-parchment">海克斯符文征召</h2>
        </div>
        <p className="text-parchment/70">
          当前选择：<span className="text-hexgold">{colorLabel[draftTurn]}</span>
        </p>
      </div>
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
              {takenBy && <p className="mt-3 text-sm text-hexgold">已由{colorLabel[takenBy]}选择</p>}
            </motion.button>
          )
        })}
      </div>
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

  return (
    <section className="hex-panel board-grid rounded-lg p-3">
      <div
        className="relative mx-auto grid aspect-[9/10] w-full max-w-[min(88vw,620px)] overflow-hidden rounded-md border border-hexgold/50 bg-[#102033]"
        style={{ gridTemplateColumns: `repeat(${BOARD_FILES}, minmax(0, 1fr))` }}
      >
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
                className={clsx(
                  'relative flex aspect-square items-center justify-center border border-hexcyan/15',
                  (file + rank) % 2 === 0 ? 'bg-white/[0.035]' : 'bg-black/[0.09]',
                  isSelected && 'ring-2 ring-hexgold',
                  activeRune && 'cursor-crosshair',
                )}
              >
                {rank === 4 && file === 4 && <span className="absolute text-xs text-hexgold/55">楚河</span>}
                {rank === 5 && file === 4 && <span className="absolute text-xs text-hexgold/55">汉界</span>}
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
                        'z-10 flex h-[76%] w-[76%] items-center justify-center rounded-full border text-[clamp(1rem,4vw,2rem)] font-bold shadow-lg',
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
      <h2 className="font-display text-xl text-parchment">当前符文</h2>
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
              <span className="text-hexgold">{rune.energyCost ? `${rune.energyCost}E` : '被动'}</span>
            </div>
            <p className="mt-1 text-xs text-parchment/65">{rune.description}</p>
          </button>
        ))}
      </div>
      {activeRune && <p className="mt-3 text-sm text-hexcyan">选择目标格以释放：{runeById[activeRune].name}</p>}
    </section>
  )
}

function Controls() {
  const { state, mode, aiDifficulty, muted, setMode, setDifficulty, startNewGame, undo, resign, toggleMute } = useGameStore()
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
        可用符文池：{runes.length} 张 · 纯前端静态运行
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
            <img src="/assets/branding/logo.svg" alt="海克斯象棋" className="h-14 w-14" />
            <div>
              <p className="font-display text-xs uppercase tracking-[0.28em] text-hexcyan">Hextech Chess</p>
              <h1 className="font-display text-3xl text-parchment sm:text-4xl">海克斯象棋</h1>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="font-display text-xl text-hexgold">{state.phase === 'draft' ? '符文征召' : colorLabel[state.turn]}</p>
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
                className="hex-panel rounded-lg bg-[url('/assets/ui/victory.svg')] bg-cover p-6 text-center"
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
