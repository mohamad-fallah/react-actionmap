import { describe, expect, it } from 'vitest'
import { createActionMap } from '../src/core/create-action-map.js'

describe('createActionMap', () => {
  it('creates an immutable action map', () => {
    const map = createActionMap([
      {
        id: 'users.view',
        label: 'View user',
        href: '/users/1',
      },
    ])

    expect(map._definitions).toHaveLength(1)
    expect(Object.isFrozen(map)).toBe(true)
    expect(Object.isFrozen(map._definitions)).toBe(true)
  })

  it('rejects duplicate action ids', () => {
    expect(() =>
      createActionMap([
        { id: 'users.view', label: 'View' },
        { id: 'users.view', label: 'View again' },
      ]),
    ).toThrow('Duplicate action id')
  })

  it('allows diagnostic-only actions without run or href', () => {
    const map = createActionMap([
      { id: 'users.placeholder', label: 'Placeholder' },
    ])

    expect(map._definitions[0]?.id).toBe('users.placeholder')
  })
})
