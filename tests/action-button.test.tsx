import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActionButton } from '../src/components/action-button.js'
import { createActionMap } from '../src/core/create-action-map.js'
import { ActionProvider } from '../src/provider/action-provider.js'

describe('ActionButton', () => {
  it('renders the resolved label and runs through the provider', async () => {
    const run = vi.fn()
    const actions = createActionMap<{ readonly name: string }>([
      {
        id: 'users.greet',
        label: (context) => `Greet ${context.name}`,
        run,
      },
    ])

    render(
      <ActionProvider actions={actions} context={{ name: 'Ada' }}>
        <ActionButton action="users.greet" />
      </ActionProvider>,
    )

    const button = screen.getByRole('button', { name: 'Greet Ada' })
    expect(button).toHaveAttribute('data-action-id', 'users.greet')
    fireEvent.click(button)

    await waitFor(() => expect(run).toHaveBeenCalledOnce())
  })

  it('hides actions without permission and disables disabled actions', () => {
    const actions = createActionMap([
      {
        id: 'admin.open',
        label: 'Open admin',
        permission: 'admin.open',
        run: () => undefined,
      },
      {
        id: 'users.delete',
        label: 'Delete user',
        disabled: true,
        run: () => undefined,
      },
    ])

    render(
      <ActionProvider actions={actions} context={{}} permissions={[]}>
        <ActionButton action="admin.open" />
        <ActionButton action="users.delete" />
      </ActionProvider>,
    )

    expect(
      screen.queryByRole('button', { name: 'Open admin' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Delete user' }),
    ).toBeDisabled()
  })
})
