import { describe, expect, it } from 'vitest'
import { createInitialState } from '../engine'
import { runeById } from '../runes'
import { useGameStore } from './gameStore'

describe('gameStore draft recovery', () => {
  it('starts the game when the current drafter cannot afford any remaining rune', () => {
    const state = createInitialState()
    state.players.red.runes = ['river-scouts', 'rune-shield', 'chain-reaction']
    state.players.red.budgetUsed = 7
    state.players.black.runes = ['circuit-map', 'steel-fortress']
    state.players.black.budgetUsed = 7

    useGameStore.setState({
      state,
      draftStage: 'runes',
      draftTurn: 'black',
      picksThisTurn: 0,
      draftPool: [runeById['tiger-tally'], runeById['last-stand'], runeById['sun-bin-feint']],
    })

    useGameStore.getState().advanceDraftIfBlocked()

    expect(useGameStore.getState().state.phase).toBe('playing')
    expect(useGameStore.getState().state.turn).toBe('red')
  })
})
