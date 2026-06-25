import { useMemo, useState } from 'react'
import {
  ActionButton,
  ActionCommandPalette,
  ActionDevTools,
  ActionMenuItem,
  ActionProvider,
  createActionMap,
} from 'react-actionmap'

type User = {
  readonly id: string
  readonly name: string
  readonly role: 'owner' | 'member'
}

type AppActionContext = {
  readonly selectedUser: User | null
  readonly deleteUser: (id: string) => Promise<void>
}

const actions = createActionMap<AppActionContext>([
  {
    id: 'users.delete',
    label: 'Delete user',
    description: 'Delete the selected user',
    group: 'Users',
    keywords: ['remove', 'destroy'],
    shortcut: 'mod+backspace',
    permission: 'users.delete',
    dangerous: true,
    confirm: {
      title: 'Delete user?',
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    },
    when: ({ selectedUser }) => Boolean(selectedUser),
    disabled: ({ selectedUser }) => selectedUser?.role === 'owner',
    disabledReason: 'Owner users cannot be deleted',
    run: async ({ selectedUser, deleteUser }) => {
      if (selectedUser) await deleteUser(selectedUser.id)
    },
  },
  {
    id: 'users.view',
    label: ({ selectedUser }) =>
      selectedUser ? `View ${selectedUser.name}` : 'View user',
    group: 'Users',
    shortcut: 'mod+enter',
    permission: 'users.view',
    when: ({ selectedUser }) => Boolean(selectedUser),
    href: ({ selectedUser }) => `/users/${selectedUser?.id ?? ''}`,
  },
])

const initialUser: User = {
  id: 'usr_123',
  name: 'Ada Lovelace',
  role: 'member',
}

export function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(
    initialUser,
  )

  const context = useMemo<AppActionContext>(
    () => ({
      selectedUser,
      deleteUser: async (id) => {
        await Promise.resolve(id)
        setSelectedUser(null)
      },
    }),
    [selectedUser],
  )

  return (
    <ActionProvider
      actions={actions}
      context={context}
      permissions={['users.view', 'users.delete']}
      navigate={(href) => {
        window.location.assign(href)
      }}
      onActionSuccess={({ action }) => {
        console.info('Action completed:', action.id)
      }}
    >
      <main>
        <h1>Users</h1>
        <p>
          Selected: {selectedUser?.name ?? 'No user selected'}
        </p>

        <ActionButton action="users.delete" />

        <div role="menu" aria-label="User actions">
          <ActionMenuItem action="users.view" />
        </div>

        <p>Press Ctrl/Cmd + K to open the command palette.</p>
      </main>

      <ActionCommandPalette />
      <ActionDevTools />
    </ActionProvider>
  )
}
