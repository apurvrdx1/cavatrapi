import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../settingsStore'

function resetStore() {
  // Re-hydrate from defaults (persist storage returns null in test env)
  useSettingsStore.setState({
    clockSeconds: 30,
    aiDifficulty: 'MEDIUM',
  })
}

describe('settingsStore', () => {
  beforeEach(resetStore)

  // ── Defaults ───────────────────────────────────────────────────────────────

  describe('initial / default state', () => {
    it('clockSeconds defaults to 30', () => {
      expect(useSettingsStore.getState().clockSeconds).toBe(30)
    })

    it('aiDifficulty defaults to MEDIUM', () => {
      expect(useSettingsStore.getState().aiDifficulty).toBe('MEDIUM')
    })
  })

  // ── setClockSeconds ────────────────────────────────────────────────────────

  describe('setClockSeconds', () => {
    it('sets clockSeconds to 15', () => {
      useSettingsStore.getState().setClockSeconds(15)
      expect(useSettingsStore.getState().clockSeconds).toBe(15)
    })

    it('sets clockSeconds to 30', () => {
      useSettingsStore.getState().setClockSeconds(30)
      expect(useSettingsStore.getState().clockSeconds).toBe(30)
    })

    it('sets clockSeconds to 45', () => {
      useSettingsStore.getState().setClockSeconds(45)
      expect(useSettingsStore.getState().clockSeconds).toBe(45)
    })

    it('updates correctly when toggled across all values', () => {
      useSettingsStore.getState().setClockSeconds(15)
      useSettingsStore.getState().setClockSeconds(45)
      useSettingsStore.getState().setClockSeconds(30)
      expect(useSettingsStore.getState().clockSeconds).toBe(30)
    })
  })

  // ── setAIDifficulty ────────────────────────────────────────────────────────

  describe('setAIDifficulty', () => {
    it('sets aiDifficulty to EASY', () => {
      useSettingsStore.getState().setAIDifficulty('EASY')
      expect(useSettingsStore.getState().aiDifficulty).toBe('EASY')
    })

    it('sets aiDifficulty to MEDIUM', () => {
      useSettingsStore.getState().setAIDifficulty('EASY')
      useSettingsStore.getState().setAIDifficulty('MEDIUM')
      expect(useSettingsStore.getState().aiDifficulty).toBe('MEDIUM')
    })

    it('sets aiDifficulty to HARD', () => {
      useSettingsStore.getState().setAIDifficulty('HARD')
      expect(useSettingsStore.getState().aiDifficulty).toBe('HARD')
    })
  })

  // ── Independence ───────────────────────────────────────────────────────────

  describe('field independence', () => {
    it('setClockSeconds does not change aiDifficulty', () => {
      useSettingsStore.getState().setAIDifficulty('HARD')
      useSettingsStore.getState().setClockSeconds(15)
      expect(useSettingsStore.getState().aiDifficulty).toBe('HARD')
    })

    it('setAIDifficulty does not change clockSeconds', () => {
      useSettingsStore.getState().setClockSeconds(45)
      useSettingsStore.getState().setAIDifficulty('EASY')
      expect(useSettingsStore.getState().clockSeconds).toBe(45)
    })
  })
})
