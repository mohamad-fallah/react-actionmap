import { describe, expect, it } from 'vitest'
import type { ActionDefinition } from '../src/core/types.js'
import {
  normalizeShortcut,
  shortcutToString,
} from '../src/keyboard/normalize-shortcut.js'
import { matchShortcut } from '../src/keyboard/match-shortcut.js'
import { detectShortcutConflicts } from '../src/keyboard/shortcut-conflicts.js'

describe('keyboard shortcuts', () => {
  it('normalizes modifier and key casing', () => {
    const normalized = normalizeShortcut(' Mod + Shift + K ')

    expect(normalized).toEqual({
      key: 'k',
      ctrl: false,
      meta: false,
      shift: true,
      alt: false,
      mod: true,
    })
    expect(shortcutToString(normalized)).toBe('mod+shift+k')
  })

  it('matches ctrl shortcuts', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
    })

    expect(matchShortcut('ctrl+k', event)).toBe(true)
  })

  it('detects conflicts only among included actions', () => {
    const actions: ReadonlyArray<ActionDefinition<object>> = [
      { id: 'one', label: 'One', shortcut: 'ctrl+k' },
      { id: 'two', label: 'Two', shortcut: ' CTRL + K ' },
      { id: 'hidden', label: 'Hidden', shortcut: 'ctrl+k' },
    ]

    expect(
      detectShortcutConflicts(actions, new Set(['one', 'two'])),
    ).toEqual([
      {
        shortcut: 'ctrl+k',
        actions: ['one', 'two'],
      },
    ])
  })
})
