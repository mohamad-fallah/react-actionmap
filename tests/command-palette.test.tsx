import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActionCommandPalette } from '../src/components/action-command-palette.js'
import { createActionMap } from '../src/core/create-action-map.js'
import { ActionProvider } from '../src/provider/action-provider.js'

describe('ActionCommandPalette', () => {
  it('opens, filters searchable fields, and runs the selected action', async () => {
    const deleteUser = vi.fn()
    const actions = createActionMap([
      {
        id: 'users.delete',
        label: 'Delete user',
        description: 'Remove the selected account',
        group: 'Users',
        keywords: ['destroy'],
        run: deleteUser,
      },
      {
        id: 'reports.export',
        label: 'Export report',
        hidden: true,
        run: () => undefined,
      },
    ])

    render(
      <ActionProvider actions={actions} context={{}}>
        <ActionCommandPalette />
      </ActionProvider>,
    )

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    const input = await screen.findByRole('combobox')
    fireEvent.change(input, { target: { value: 'destroy' } })

    expect(
      screen.getByRole('option', { name: /Delete user/ }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Export report')).not.toBeInTheDocument()

    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(deleteUser).toHaveBeenCalledOnce())
  })

  it('shows disabled actions but does not select them', async () => {
    const run = vi.fn()
    const actions = createActionMap([
      {
        id: 'billing.refund',
        label: 'Refund payment',
        disabled: true,
        run,
      },
    ])

    render(
      <ActionProvider actions={actions} context={{}}>
        <ActionCommandPalette openShortcut="ctrl+p" />
      </ActionProvider>,
    )

    fireEvent.keyDown(window, { key: 'p', ctrlKey: true })
    const option = await screen.findByRole('option', {
      name: 'Refund payment',
    })

    expect(option).toBeDisabled()
    fireEvent.click(option)
    expect(run).not.toHaveBeenCalled()
  })
})
