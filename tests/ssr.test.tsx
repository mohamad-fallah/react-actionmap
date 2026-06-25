import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ActionButton } from '../src/components/action-button.js'
import { ActionCommandPalette } from '../src/components/action-command-palette.js'
import { createActionMap } from '../src/core/create-action-map.js'
import { ActionProvider } from '../src/provider/action-provider.js'

describe('SSR safety', () => {
  it('renders without accessing browser globals during render', () => {
    const actions = createActionMap([
      {
        id: 'home.open',
        label: 'Open home',
        href: '/',
      },
    ])

    expect(() =>
      renderToString(
        <ActionProvider actions={actions} context={{}}>
          <ActionButton action="home.open" />
          <ActionCommandPalette />
        </ActionProvider>,
      ),
    ).not.toThrow()
  })
})
