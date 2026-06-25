# react-actionmap

Type-safe React action registry for buttons, menus, command palettes, shortcuts, permissions, confirmations, and analytics.

Define an application action once, then reuse it everywhere it appears. `react-actionmap` keeps labels, visibility, permissions, disabled rules, confirmation, navigation, keyboard shortcuts, execution, and analytics in one central action map.

It is designed for dashboards, admin panels, SaaS products, CRMs, ERPs, finance applications, and other React interfaces with repeated user actions.

## Why

A production application often exposes the same operation through several surfaces:

- a primary button;
- a dropdown or context menu;
- a command palette;
- a keyboard shortcut;
- a permission gate;
- a confirmation dialog;
- an analytics event.

When each surface implements its own rules, they drift. A shortcut may bypass RBAC, a command palette may skip confirmation, and the same action may use conflicting labels.

`react-actionmap` makes the action definition the source of truth.

## Installation

```bash
npm install react-actionmap
```

React 18 and React 19 are supported. React is a peer dependency.

## Basic React example

```tsx
import {
  ActionButton,
  ActionCommandPalette,
  ActionDevTools,
  ActionMenuItem,
  ActionProvider,
  createActionMap,
} from 'react-actionmap'

type User = {
  id: string
  role: 'owner' | 'member'
}

type AppContext = {
  selectedUser: User | null
  api: {
    users: {
      delete: (id: string) => Promise<void>
    }
  }
}

const actions = createActionMap<AppContext>([
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
    run: async ({ selectedUser, api }) => {
      if (selectedUser) await api.users.delete(selectedUser.id)
    },
  },
  {
    id: 'users.view',
    label: 'View user',
    group: 'Users',
    permission: 'users.view',
    href: ({ selectedUser }) => `/admin/users/${selectedUser?.id}`,
    when: ({ selectedUser }) => Boolean(selectedUser),
  },
])

export function UsersPage({ selectedUser, api }: AppContext) {
  return (
    <ActionProvider
      actions={actions}
      context={{ selectedUser, api }}
      permissions={['users.view', 'users.delete']}
      navigate={(href) => {
        window.location.assign(href)
      }}
      onActionSuccess={({ action }) => {
        analytics.track(action.id)
      }}
    >
      <ActionButton action="users.delete" />

      <div role="menu">
        <ActionMenuItem action="users.view" />
      </div>

      <ActionCommandPalette />
      <ActionDevTools />
    </ActionProvider>
  )
}
```

The button, menu item, command palette, and shortcut all use the same permission, visibility, disabled, confirmation, execution, and navigation rules.

## Next.js App Router

Keep the action provider in a Client Component. Server layouts can load permissions and pass the serializable permission list into that wrapper.

```tsx
// app/action-provider.tsx
'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ActionCommandPalette,
  ActionProvider,
  createActionMap,
} from 'react-actionmap'

type ActionContext = {
  refresh: () => void
}

const actions = createActionMap<ActionContext>([
  {
    id: 'dashboard.refresh',
    label: 'Refresh dashboard',
    shortcut: 'mod+r',
    permission: 'dashboard.read',
    run: ({ refresh }) => refresh(),
  },
  {
    id: 'settings.open',
    label: 'Open settings',
    permission: 'settings.read',
    href: '/settings',
  },
])

export function AppActionProvider({
  permissions,
  children,
}: {
  permissions: readonly string[]
  children: React.ReactNode
}) {
  const router = useRouter()
  const context = useMemo(
    () => ({ refresh: () => router.refresh() }),
    [router],
  )

  return (
    <ActionProvider
      actions={actions}
      context={context}
      permissions={permissions}
      navigate={(href) => router.push(href)}
    >
      {children}
      <ActionCommandPalette />
    </ActionProvider>
  )
}
```

```tsx
// app/layout.tsx — Server Component
import { AppActionProvider } from './action-provider'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const permissions = await getCurrentUserPermissions()

  return (
    <html lang="en">
      <body>
        <AppActionProvider permissions={permissions}>
          {children}
        </AppActionProvider>
      </body>
    </html>
  )
}
```

```tsx
// app/dashboard-actions.tsx
'use client'

import { ActionButton } from 'react-actionmap'

export function DashboardActions() {
  return <ActionButton action="dashboard.refresh" />
}
```

Browser globals are never accessed during render. Shortcut listeners, focus management, and the default browser confirmation are client-only.

## API

### `createActionMap`

Creates an immutable action registry and rejects empty or duplicate IDs.

```ts
const actions = createActionMap<AppContext>([
  {
    id: 'invoices.send',
    label: ({ invoice }) => `Send invoice ${invoice.number}`,
    permission: 'invoices.send',
    run: ({ invoice, api }) => api.invoices.send(invoice.id),
  },
])
```

An action may define:

- `id`, `label`, `description`, `group`, and `keywords`;
- `shortcut`;
- `permission` as one permission or an array requiring every permission;
- `hidden`, `when`, `disabled`, and `disabledReason`;
- `dangerous` and `confirm`;
- `run`, `href`, or both.

When both `run` and `href` are present, `run` completes before navigation.

### `ActionProvider`

Provides the action registry and the live application context.

```tsx
<ActionProvider
  actions={actions}
  context={context}
  permissions={currentUser.permissions}
  navigate={(href) => router.push(href)}
  confirm={showProductConfirmDialog}
  onActionRun={trackAttempt}
  onActionSuccess={trackSuccess}
  onActionError={reportFailure}
>
  {children}
</ActionProvider>
```

`permissions` can also be a checker:

```tsx
permissions={(permission, context) =>
  context.currentUser.permissions.includes(permission)
}
```

Without a custom `confirm`, confirmed actions use `window.confirm` on the client. Without `navigate`, href actions use `window.location.assign` on the client.

### `useAction`

Returns the resolved state for one action and throws if its ID is unknown.

```tsx
const state = useAction('users.delete')
```

Resolved state includes the label, description, visibility, disabled state, disabled reason, dangerous flag, confirmation copy, shortcut, resolved href, and `canRun`.

### `useActions`

Returns resolved actions with optional filtering.

```tsx
const visibleUserActions = useActions({
  group: 'Users',
  includeHidden: false,
  includeDisabled: true,
})
```

### `useCanAction`

Returns `true` only when the action exists, is permitted, is visible for the current context, and is not disabled.

```tsx
const canDelete = useCanAction('users.delete')
```

### `useActionState`

Like `useAction`, but returns `null` for an unknown ID.

### `useRunAction`

Returns the central async runner.

```tsx
const runAction = useRunAction()
await runAction('users.delete')
```

### `ActionButton`

Renders a normal `<button>` using the action label by default.

```tsx
<ActionButton
  action="users.delete"
  className="danger-button"
  disabledMode="disable"
/>
```

Use `disabledMode="hide"` to hide disabled actions. Hidden and unauthorized actions are always omitted. Native button attributes are forwarded.

The `render` prop can replace the default output:

```tsx
<ActionButton
  action="users.delete"
  render={(state) => <MyButtonView state={state} />}
/>
```

For a fully custom interactive component, combine `useAction` with `useRunAction`.

### `ActionMenuItem`

Renders a headless `<button role="menuitem">` and accepts the same action-specific customization as `ActionButton`.

```tsx
<ActionMenuItem action="users.view" className="menu-item" />
```

### `ActionCommandPalette`

Provides a minimal accessible command palette with no UI dependency.

```tsx
<ActionCommandPalette
  openShortcut="mod+k"
  placeholder="Search commands…"
  className="command-dialog"
  renderItem={(state, active) => (
    <CommandRow action={state} active={active} />
  )}
/>
```

It searches by ID, label, description, group, and keywords. It supports Arrow Up, Arrow Down, Enter, and Escape. Hidden and unauthorized actions are excluded; disabled actions remain visible but cannot run.

### `ActionDevTools`

Development-only diagnostics for action counts, dangerous actions without confirmation, shortcut conflicts, and actions without `run` or `href`.

```tsx
<ActionDevTools position="bottom-right" />
```

It returns `null` when `process.env.NODE_ENV === 'production'`.

## Keyboard shortcuts

Supported modifiers are `ctrl`, `meta`, `shift`, `alt`, and `mod`. `mod` maps to Meta on Apple platforms and Ctrl elsewhere.

```ts
shortcut: 'mod+shift+p'
```

Action shortcuts are ignored while the user is typing in an input, textarea, select, or contenteditable element. Visible shortcut conflicts produce a development warning and appear in `ActionDevTools`.

## Rendering and data attributes

Default action components expose:

- `data-action-id`;
- `data-action-group`;
- `data-dangerous`;
- `data-disabled`;
- `data-hidden`.

The package has no stylesheet and no dependency on Tailwind CSS, shadcn/ui, Material UI, Chakra UI, Radix UI, or another design system.

## Comparison

`react-actionmap` is not just a command palette, hotkey library, or permission library.

A command palette handles discovery and selection, but usually does not centralize buttons and menus. A hotkey library binds keys, but does not guarantee RBAC and confirmation consistency. A permission library answers authorization questions, but does not own labels, navigation, execution, and analytics.

`react-actionmap` combines action definition, rendering, permissions, shortcuts, confirmation, navigation, execution, and analytics in one central action map while leaving visual design to the application.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

The build emits ESM, CommonJS, source maps, and TypeScript declarations into `dist`.

## SEO and use cases

Useful search terms and use cases include React actions, React action registry, React command palette, React keyboard shortcuts, React permissions, React RBAC, React admin panel actions, and Next.js dashboard actions.

## License

MIT
