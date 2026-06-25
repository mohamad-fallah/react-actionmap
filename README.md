# react-actionmap

A type-safe action registry for React applications.

Define an action once, then reuse the same label, permission rules, visibility, disabled state, confirmation, keyboard shortcut, navigation, execution, and analytics across buttons, menus, command palettes, and custom UI.

`react-actionmap` is useful for dashboards, admin panels, SaaS products, CRMs, ERPs, finance applications, and any React interface where the same user action appears in multiple places.

## Why use it?

In a typical application, one operation may appear as:

- a page button;
- a dropdown or context-menu item;
- a command-palette command;
- a keyboard shortcut;
- a permission-protected operation;
- a confirmed destructive action;
- an analytics event.

When each UI surface implements its own rules, behavior can drift. A shortcut may bypass permission checks, a menu may forget confirmation, or different screens may use conflicting labels.

With `react-actionmap`, the action definition becomes the single source of truth:

```text
Action definition
  -> permission and visibility checks
  -> disabled-state checks
  -> optional confirmation
  -> run handler
  -> optional navigation
  -> lifecycle callbacks
```

## Features

- Full TypeScript inference for your application context
- React 18 and React 19 support
- Centralized action definitions
- Buttons and menu items
- Accessible command palette
- Cross-platform keyboard shortcuts
- Permission and RBAC checks
- Conditional visibility and disabled states
- Confirmation before execution
- Action-based navigation
- Analytics and error-reporting callbacks
- SSR-safe rendering
- Next.js App Router support
- Development diagnostics
- No required stylesheet or UI-library dependency
- ESM and CommonJS builds

## Requirements

- Node.js 18 or newer
- React 18 or newer

React is a peer dependency. Your application should already have React installed.

## Installation

Choose the command for your package manager.

### npm

```bash
npm install react-actionmap
```

### Yarn

```bash
yarn add react-actionmap
```

### pnpm

```bash
pnpm add react-actionmap
```

If React is not already installed in the project:

```bash
# npm
npm install react react-dom react-actionmap

# Yarn
yarn add react react-dom react-actionmap

# pnpm
pnpm add react react-dom react-actionmap
```

## Quick start

### 1. Describe the application context

The context contains the live data and services that actions need.

```tsx
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
```

### 2. Create the action map

Define the map outside the component when the definitions themselves are static. Dynamic values should be read from the context.

```tsx
import { createActionMap } from 'react-actionmap'

const actions = createActionMap<AppContext>([
  {
    id: 'users.delete',
    label: 'Delete user',
    description: 'Permanently delete the selected user',
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
      if (selectedUser) {
        await api.users.delete(selectedUser.id)
      }
    },
  },
  {
    id: 'users.view',
    label: ({ selectedUser }) =>
      selectedUser ? `View ${selectedUser.id}` : 'View user',
    description: 'Open the selected user profile',
    group: 'Users',
    permission: 'users.view',
    when: ({ selectedUser }) => Boolean(selectedUser),
    href: ({ selectedUser }) => `/admin/users/${selectedUser?.id}`,
  },
])
```

### 3. Add `ActionProvider`

The provider connects the static action map to the current context, permissions, router, confirmation UI, and lifecycle callbacks.

```tsx
import {
  ActionButton,
  ActionCommandPalette,
  ActionDevTools,
  ActionMenuItem,
  ActionProvider,
} from 'react-actionmap'

export function UsersPage({ selectedUser, api }: AppContext) {
  return (
    <ActionProvider
      actions={actions}
      context={{ selectedUser, api }}
      permissions={['users.view', 'users.delete']}
      navigate={(href) => window.location.assign(href)}
      onActionRun={({ action }) => {
        console.log('Attempted:', action.id)
      }}
      onActionSuccess={({ action }) => {
        console.log('Completed:', action.id)
      }}
      onActionError={({ action, error }) => {
        console.error(`Failed: ${action.id}`, error)
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

The button, menu item, command palette, and keyboard shortcut now use the same rules.

## How action execution works

When an action is requested, `react-actionmap` performs these steps:

1. Checks every required permission.
2. Evaluates `when` and `hidden`.
3. Evaluates `disabled` and `disabledReason`.
4. Calls `onActionRun`.
5. Requests confirmation when `confirm` is defined.
6. Runs the `run` handler.
7. Navigates to the resolved `href`.
8. Calls `onActionSuccess`.

If `run` throws or navigation throws, `onActionError` is called and the error is rethrown.

Important behavior:

- If both `run` and `href` exist, `run` completes before navigation.
- Declining confirmation stops execution without calling `onActionSuccess`.
- `onActionRun` is called before the confirmation prompt.
- An unauthorized or unavailable action cannot be executed through the central runner.

## Defining actions

Each action supports the following fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | `string` | Unique, non-empty action identifier |
| `label` | `string \| (context) => string` | User-facing action name |
| `description` | `string \| (context) => string` | Additional action information |
| `group` | `string` | Groups actions in lists or command palettes |
| `keywords` | `readonly string[]` | Extra command-palette search terms |
| `shortcut` | `string` | Keyboard shortcut such as `mod+k` |
| `permission` | `string \| readonly string[]` | Required permission or permissions |
| `dangerous` | `boolean` | Marks a destructive or risky action |
| `confirm` | `ActionConfirm` | Confirmation content shown before execution |
| `hidden` | `boolean \| (context) => boolean` | Explicitly hides an action |
| `when` | `(context) => boolean` | Makes an action available only in matching context |
| `disabled` | `boolean \| (context) => boolean` | Keeps an action visible but prevents execution |
| `disabledReason` | `string \| (context) => string` | Explains why an action is disabled |
| `href` | `string \| (context) => string` | Destination to open after execution |
| `run` | `(context) => void \| Promise<void>` | Action implementation |

`label`, `description`, `hidden`, `disabled`, `disabledReason`, `href`, and confirmation text can be derived from the current context.

`createActionMap` freezes the registry and rejects empty or duplicate IDs.

## Permissions

Pass an array of granted permissions:

```tsx
<ActionProvider
  actions={actions}
  context={context}
  permissions={currentUser.permissions}
>
  {children}
</ActionProvider>
```

Or use a custom permission checker:

```tsx
<ActionProvider
  actions={actions}
  context={context}
  permissions={(permission, currentContext) =>
    currentContext.currentUser.permissions.includes(permission)
  }
>
  {children}
</ActionProvider>
```

An action requiring multiple permissions only runs when every permission is granted:

```tsx
{
  id: 'invoices.approve',
  label: 'Approve invoice',
  permission: ['invoices.read', 'invoices.approve'],
  run: ({ invoice, api }) => api.invoices.approve(invoice.id),
}
```

Permission behavior:

- An action without `permission` is allowed by default.
- An action with `permission` is denied when the provider has no `permissions` prop.
- Unauthorized actions are resolved as hidden.
- Permissions are checked again during execution, not only during rendering.

## Visibility and disabled states

Use `when` when an action only makes sense in a particular context:

```tsx
{
  id: 'records.archive',
  label: 'Archive record',
  when: ({ selectedRecord }) => selectedRecord !== null,
  run: ({ selectedRecord, api }) => {
    if (selectedRecord) return api.records.archive(selectedRecord.id)
  },
}
```

Use `hidden` for an explicit visibility rule:

```tsx
hidden: ({ featureFlags }) => !featureFlags.archiving
```

Use `disabled` when the action should remain visible but must not run:

```tsx
disabled: ({ selectedRecord }) => selectedRecord?.status === 'locked',
disabledReason: 'Locked records cannot be archived',
```

An action becomes hidden when it:

- fails its permission check;
- returns `false` from `when`;
- resolves `hidden` to `true`.

A disabled action stays visible by default but has `canRun: false`.

## Confirmation

Add confirmation to any action:

```tsx
{
  id: 'projects.delete',
  label: 'Delete project',
  dangerous: true,
  confirm: {
    title: ({ project }) => `Delete ${project.name}?`,
    description: 'This action cannot be undone.',
    confirmLabel: 'Delete project',
    cancelLabel: 'Keep project',
  },
  run: ({ project, api }) => api.projects.delete(project.id),
}
```

Without a custom confirmation function, the package uses `window.confirm` in the browser. The browser dialog can only display the title and description; custom button labels require your own confirmation UI.

```tsx
<ActionProvider
  actions={actions}
  context={context}
  confirm={async (options) => {
    return openConfirmationDialog({
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel,
      cancelLabel: options.cancelLabel,
    })
  }}
>
  {children}
</ActionProvider>
```

The custom `confirm` function may return either a boolean or `Promise<boolean>`.

## Navigation

An action can navigate without a run handler:

```tsx
{
  id: 'settings.open',
  label: 'Open settings',
  href: '/settings',
}
```

For React Router:

```tsx
const navigate = useNavigate()

<ActionProvider
  actions={actions}
  context={context}
  navigate={navigate}
>
  {children}
</ActionProvider>
```

For Next.js:

```tsx
const router = useRouter()

<ActionProvider
  actions={actions}
  context={context}
  navigate={(href) => router.push(href)}
>
  {children}
</ActionProvider>
```

If `navigate` is not provided, href actions use `window.location.assign` in the browser.

## Components

### `ActionButton`

Renders a standard `<button>`.

```tsx
<ActionButton
  action="users.delete"
  className="danger-button"
  disabledMode="disable"
/>
```

Behavior:

- Uses the action label as its default content.
- Forwards native button attributes.
- Uses `type="button"` unless another type is provided.
- Sets `aria-label`, `aria-busy`, and useful `data-*` attributes.
- Disables itself while an async action is pending.
- Hides hidden and unauthorized actions.
- Keeps disabled actions visible by default.

Use custom children to replace the visible label:

```tsx
<ActionButton action="users.delete">
  <TrashIcon />
  Delete
</ActionButton>
```

Use `disabledMode="hide"` to omit disabled actions:

```tsx
<ActionButton action="users.delete" disabledMode="hide" />
```

The `render` prop replaces the complete default button output:

```tsx
<ActionButton
  action="users.delete"
  render={(state) => <MyReadOnlyActionPreview state={state} />}
/>
```

The `render` callback only receives resolved state and does not automatically wire click execution. For a fully custom interactive component, use `useAction` with `useRunAction`.

### `ActionMenuItem`

Renders a headless `<button role="menuitem">` and supports the same action-specific behavior as `ActionButton`.

```tsx
<div role="menu">
  <ActionMenuItem action="users.view" className="menu-item" />
  <ActionMenuItem action="users.delete" className="menu-item" />
</div>
```

### `ActionCommandPalette`

Provides a minimal accessible command palette with no external UI dependency.

```tsx
<ActionCommandPalette
  openShortcut="mod+k"
  placeholder="Search commands..."
  overlayClassName="command-overlay"
  className="command-dialog"
  inputClassName="command-input"
  listClassName="command-list"
  itemClassName="command-item"
  noResultsClassName="command-empty"
/>
```

It:

- searches action ID, label, description, group, and keywords;
- supports Arrow Up, Arrow Down, Enter, and Escape;
- closes when the overlay is clicked;
- excludes hidden and unauthorized actions;
- displays disabled actions but prevents their execution;
- uses `mod+k` as its default opening shortcut.

Customize rows and empty results:

```tsx
<ActionCommandPalette
  renderItem={(state, isActive) => (
    <CommandRow action={state} active={isActive} />
  )}
  renderEmpty={() => <p>No matching commands.</p>}
/>
```

### `ActionDevTools`

Displays development-only diagnostics:

```tsx
<ActionDevTools position="bottom-right" />
```

It reports:

- total, visible, hidden, disabled, and dangerous action counts;
- dangerous actions without confirmation;
- conflicting visible shortcuts;
- actions without `run` or `href`.

It automatically returns `null` when `process.env.NODE_ENV === 'production'`.

## Hooks

All hooks must be used inside `ActionProvider`.

### `useAction`

Returns the resolved state of one action and throws `ActionNotFoundError` when the ID does not exist.

```tsx
const deleteAction = useAction('users.delete')

return (
  <p>
    {deleteAction.label}: {deleteAction.canRun ? 'available' : 'unavailable'}
  </p>
)
```

### `useActionState`

Works like `useAction`, but returns `null` for an unknown ID.

```tsx
const optionalAction = useActionState(actionId)
```

### `useActions`

Returns resolved actions with optional filtering.

```tsx
const userActions = useActions({
  group: 'Users',
  includeHidden: false,
  includeDisabled: true,
})
```

Defaults:

- `includeHidden: false`
- `includeDisabled: true`

### `useCanAction`

Returns `true` only when the action exists, is permitted, is visible, and is not disabled.

```tsx
const canDelete = useCanAction('users.delete')
```

### `useRunAction`

Returns the central async action runner.

```tsx
import { useAction, useRunAction } from 'react-actionmap'

function CustomDeleteControl() {
  const action = useAction('users.delete')
  const runAction = useRunAction()

  if (action.hidden) return null

  return (
    <button
      type="button"
      disabled={!action.canRun}
      title={action.disabledReason}
      onClick={() => void runAction(action.id)}
    >
      {action.label}
    </button>
  )
}
```

The runner applies permission, visibility, disabled, confirmation, execution, navigation, and lifecycle rules.

## Resolved action state

Hooks and render callbacks expose a `ResolvedActionState`:

```ts
type ResolvedActionState = {
  id: string
  label: string
  description: string | undefined
  group: string | undefined
  keywords: readonly string[] | undefined
  shortcut: string | undefined
  permission: string | readonly string[] | undefined
  dangerous: boolean
  confirm: ResolvedConfirm | undefined
  hidden: boolean
  disabled: boolean
  disabledReason: string | undefined
  href: string | undefined
  hasHref: boolean
  hasRun: boolean
  canRun: boolean
}
```

`canRun` is `true` only when the action is both visible and enabled.

## Error handling

The central runner may throw:

- `ActionNotFoundError`: the requested ID does not exist;
- `ActionPermissionError`: required permission is missing;
- `ActionUnavailableError`: the action is hidden or does not match `when`;
- `ActionDisabledError`: the action is disabled;
- an error thrown by your `run` or navigation implementation.

```tsx
import {
  ActionDisabledError,
  ActionPermissionError,
  useRunAction,
} from 'react-actionmap'

function CustomControl() {
  const runAction = useRunAction()

  const handleClick = async () => {
    try {
      await runAction('reports.export')
    } catch (error) {
      if (error instanceof ActionPermissionError) {
        showToast('You do not have permission to export reports.')
        return
      }

      if (error instanceof ActionDisabledError) {
        showToast(error.message)
        return
      }

      throw error
    }
  }

  return <button onClick={() => void handleClick()}>Export</button>
}
```

`ActionButton`, `ActionMenuItem`, command-palette items, and shortcuts prevent unhandled promise rejections. Use `ActionProvider.onActionError` to report errors triggered by those built-in surfaces.

## Keyboard shortcuts

Supported modifiers:

- `mod`
- `ctrl`
- `meta`
- `shift`
- `alt`

`mod` maps to Command/Meta on Apple platforms and Ctrl elsewhere.

```tsx
{
  id: 'command.open',
  label: 'Open command',
  shortcut: 'mod+shift+p',
  run: () => openCommand(),
}
```

Common key names include:

- `enter`, `return`
- `escape`, `esc`
- `backspace`
- `delete`, `del`
- `space`
- `tab`
- `arrowup`, `arrowdown`, `arrowleft`, `arrowright`
- `home`, `end`, `pageup`, `pagedown`

Shortcuts are ignored while the user is typing in:

- `input`
- `textarea`
- `select`
- content-editable elements

If multiple visible actions use the same shortcut, development mode logs a warning and `ActionDevTools` reports the conflict. The first runnable matching action in the map handles the shortcut.

## Styling

The package does not require a stylesheet and does not depend on Tailwind CSS, shadcn/ui, Material UI, Chakra UI, Radix UI, or another design system.

Built-in components accept class names:

```tsx
<ActionButton className="action-button" action="users.delete" />

<ActionCommandPalette
  overlayClassName="palette-overlay"
  className="palette-dialog"
  inputClassName="palette-input"
  listClassName="palette-list"
  itemClassName="palette-item"
  noResultsClassName="palette-empty"
/>
```

Rendered action controls expose:

- `data-action-id`
- `data-action-group`
- `data-dangerous`
- `data-disabled`
- `data-hidden`

Example:

```css
[data-action-id='users.delete'][data-dangerous='true'] {
  color: #b42318;
}

[data-action-id][data-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.55;
}
```

Hidden actions are not rendered, so rendered controls currently expose `data-hidden="false"`.

## Next.js App Router

Place `ActionProvider` in a Client Component. A Server Component can load permissions and pass the serializable permission list to that wrapper.

```tsx
// app/action-provider.tsx
'use client'

import { useMemo } from 'react'
import type { ReactNode } from 'react'
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
  children: ReactNode
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
// app/layout.tsx - Server Component
import type { ReactNode } from 'react'
import { AppActionProvider } from './action-provider'

export default async function RootLayout({
  children,
}: {
  children: ReactNode
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

Browser globals are not accessed during render. Shortcut listeners, focus management, default confirmation, and default browser navigation only run on the client.

## Lower-level utilities

The package also exports lower-level helpers for advanced integrations:

- `evaluateAction`
- `canRunAction`
- `normalizeKey`
- `normalizeShortcut`
- `shortcutToString`
- `matchShortcut`
- `isTypingTarget`
- `detectShortcutConflicts`

Most applications only need `createActionMap`, `ActionProvider`, the hooks, and the built-in components.

## Recommended project structure

For larger applications, keep definitions near their domain and combine them into one map:

```text
src/
  actions/
    users.ts
    invoices.ts
    reports.ts
    index.ts
  app-action-provider.tsx
```

Example domain file:

```tsx
// actions/invoices.ts
import type { ActionDefinition } from 'react-actionmap'
import type { AppContext } from '../app-context'

export const invoiceActions = [
  {
    id: 'invoices.send',
    label: ({ invoice }) => `Send invoice ${invoice.number}`,
    permission: 'invoices.send',
    run: ({ invoice, api }) => api.invoices.send(invoice.id),
  },
] satisfies readonly ActionDefinition<AppContext>[]
```

Combine the definitions:

```tsx
import { createActionMap } from 'react-actionmap'
import { invoiceActions } from './invoices'
import { userActions } from './users'

export const actions = createActionMap([
  ...invoiceActions,
  ...userActions,
])
```

## Development

Install dependencies with the package manager used by this repository:

```bash
npm install
```

Available scripts:

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run test:watch
npm run test:coverage
npm run build
```

The production build emits ESM, CommonJS, source maps, and TypeScript declarations into `dist`.

## License

MIT
