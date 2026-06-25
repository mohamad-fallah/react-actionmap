# react-actionmap

Define important React actions once, then use them everywhere.

`react-actionmap` keeps the behavior of buttons, menu items, command palettes, keyboard shortcuts, permissions, confirmations, navigation, and analytics consistent.

## What is this?

Most applications have actions such as:

- Delete user
- Open settings
- Refresh dashboard
- Approve invoice
- Export report
- Close ticket

The same action often appears in several places. For example, **Delete user** may be available as a button, a dropdown item, a command-palette result, and a keyboard shortcut.

Without a shared definition, every place must separately implement the action label, permission check, disabled state, confirmation, and execution logic.

`react-actionmap` gives these actions one shared home:

> Define the action once. Use it everywhere.

```tsx
const actions = createActionMap([
  {
    id: 'users.delete',
    label: 'Delete user',
    permission: 'users.delete',
    dangerous: true,
    confirm: {
      title: 'Delete user?',
    },
    run: ({ selectedUser, api }) =>
      api.users.delete(selectedUser.id),
  },
])
```

The same definition can then power different parts of the interface:

```tsx
<ActionButton action="users.delete" />
<ActionMenuItem action="users.delete" />
<ActionCommandPalette />
```

The package automatically keeps the label, permission, visibility, disabled state, confirmation, shortcut, navigation, execution, and lifecycle callbacks consistent.

## The real-world problem

Without a central action registry, action logic is often repeated in:

- a button;
- a dropdown or context-menu item;
- a command-palette item;
- a keyboard shortcut;
- a permission check;
- a confirmation dialog;
- analytics tracking.

Repeated logic eventually becomes inconsistent:

- The button checks permissions, but the shortcut does not.
- The delete button asks for confirmation, but the command palette does not.
- The same action has different labels in different places.
- A disabled action can still run from another UI surface.
- Analytics is tracked in one place but forgotten in another.

`react-actionmap` solves this by making the action definition the single source of truth.

Every built-in way of running an action goes through the same checks:

```text
Action request
  -> permission and visibility checks
  -> disabled-state check
  -> optional confirmation
  -> run handler
  -> optional navigation
  -> success or error callback
```

## Before and after

### Before

The same behavior is implemented separately:

```tsx
function DeleteButton() {
  if (!permissions.includes('users.delete')) return null

  return (
    <button
      disabled={!selectedUser || selectedUser.role === 'owner'}
      onClick={async () => {
        if (!window.confirm('Delete user?')) return
        analytics.track('users.delete')
        await api.users.delete(selectedUser.id)
      }}
    >
      Delete user
    </button>
  )
}
```

The menu item, shortcut, and command palette would need to repeat the same rules.

### After

Define the behavior once:

```tsx
const actions = createActionMap<AppContext>([
  {
    id: 'users.delete',
    label: 'Delete user',
    permission: 'users.delete',
    when: ({ selectedUser }) => Boolean(selectedUser),
    disabled: ({ selectedUser }) => selectedUser?.role === 'owner',
    disabledReason: 'Owner users cannot be deleted',
    shortcut: 'mod+backspace',
    dangerous: true,
    confirm: {
      title: 'Delete user?',
      description: 'This action cannot be undone.',
    },
    run: async ({ selectedUser, api }) => {
      if (selectedUser) {
        await api.users.delete(selectedUser.id)
      }
    },
  },
])
```

Then reuse it:

```tsx
<ActionButton action="users.delete" />
<ActionMenuItem action="users.delete" />
<ActionCommandPalette />
```

The provider can track every action from one place:

```tsx
<ActionProvider
  actions={actions}
  context={context}
  permissions={currentUser.permissions}
  onActionSuccess={({ action }) => analytics.track(action.id)}
>
  {children}
</ActionProvider>
```

## When should you use it?

This package is useful when actions repeat across different parts of a React application.

Common use cases include:

- React dashboards;
- admin panels;
- SaaS apps;
- CRMs;
- ERPs;
- finance apps;
- support panels;
- complex apps with repeated actions;
- apps with permissions or React RBAC rules;
- apps with React keyboard shortcuts;
- apps with a React command palette;
- apps with destructive actions that need confirmation.

It is especially useful when a React admin panel or Next.js dashboard has the same operation in buttons, menus, shortcuts, and other UI surfaces.

## When should you not use it?

It may be unnecessary for:

- simple landing pages;
- static marketing websites;
- very small apps with only a few buttons;
- apps that do not have repeated actions.

If an operation only exists in one place and has no shared permission, confirmation, shortcut, or analytics behavior, a normal event handler may be simpler.

## Installation

Requirements:

- Node.js 18 or newer
- React 18 or newer

React is a peer dependency and should already be installed in your application.

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

If the project does not already have React:

```bash
# npm
npm install react react-dom react-actionmap

# Yarn
yarn add react react-dom react-actionmap

# pnpm
pnpm add react react-dom react-actionmap
```

## Quick start

### 1. Define the context

The **context** is the live application data and services that actions can use.

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
    label: 'View user',
    description: 'Open the selected user profile',
    group: 'Users',
    permission: 'users.view',
    when: ({ selectedUser }) => Boolean(selectedUser),
    href: ({ selectedUser }) => `/admin/users/${selectedUser?.id}`,
  },
])
```

Define the map outside the React component when the definitions are static. Read changing values such as the selected user from the context.

### 3. Add the provider

`ActionProvider` connects the action map to the current context, permissions, router, confirmation UI, and lifecycle callbacks.

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

The button, menu item, command palette, and keyboard shortcut now use the same action rules.

## Core concepts

### Action map

An action map is the central list of actions in the application. `createActionMap` freezes this list and rejects empty or duplicate IDs.

```tsx
const actions = createActionMap<AppContext>([
  {
    id: 'dashboard.refresh',
    label: 'Refresh dashboard',
    run: ({ refresh }) => refresh(),
  },
])
```

This is the React action registry that other components and hooks read from.

### Context

Context contains the current data and functions needed by actions:

```tsx
const context = {
  selectedUser,
  currentUser,
  api,
}

<ActionProvider
  actions={actions}
  context={context}
>
  {children}
</ActionProvider>
```

When the provider receives a new context value, labels, visibility, disabled states, confirmation text, and destinations are evaluated again.

### Resolved values

Several action fields can be a fixed value or a function of the context:

```tsx
{
  id: 'invoices.send',
  label: ({ invoice }) => `Send invoice ${invoice.number}`,
  disabled: ({ invoice }) => invoice.status !== 'draft',
  disabledReason: 'Only draft invoices can be sent',
  href: ({ invoice }) => `/invoices/${invoice.id}`,
}
```

The following fields can use the current context:

- `label`
- `description`
- `hidden`
- `disabled`
- `disabledReason`
- `href`
- confirmation text

### Visibility and availability

Use `when` when the action only makes sense in a particular context:

```tsx
when: ({ selectedRecord }) => selectedRecord !== null
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

An action is hidden when it:

- fails its permission check;
- returns `false` from `when`;
- resolves `hidden` to `true`.

A disabled action remains visible by default but has `canRun: false`.

### Execution order

When an action runs, the package:

1. checks all required permissions;
2. checks `when` and `hidden`;
3. checks `disabled`;
4. calls `onActionRun`;
5. requests confirmation when `confirm` exists;
6. awaits `run`;
7. navigates to `href`;
8. calls `onActionSuccess`.

Important details:

- If both `run` and `href` exist, `run` completes before navigation.
- Declining confirmation stops the action without calling `onActionSuccess`.
- `onActionRun` is called before confirmation.
- Permissions and availability are checked again during execution.
- If `run` or navigation throws, `onActionError` is called and the error is rethrown.

## Components

All components must be rendered inside `ActionProvider`.

### `ActionButton`

Renders a standard `<button>` from an action:

```tsx
<ActionButton
  action="users.delete"
  className="danger-button"
/>
```

It:

- uses the action label as its default content;
- forwards native button attributes;
- uses `type="button"` by default;
- hides hidden and unauthorized actions;
- disables disabled actions;
- prevents duplicate clicks while an async action is running;
- sets accessibility and action-related data attributes.

Custom children replace the visible label:

```tsx
<ActionButton action="users.delete">
  <TrashIcon />
  Delete
</ActionButton>
```

Hide disabled actions instead of rendering a disabled button:

```tsx
<ActionButton
  action="users.delete"
  disabledMode="hide"
/>
```

The `render` prop replaces the complete default output:

```tsx
<ActionButton
  action="users.delete"
  render={(state) => <MyActionPreview state={state} />}
/>
```

The `render` callback does not automatically connect click execution. Use `useAction` and `useRunAction` for a fully custom interactive control.

### `ActionMenuItem`

Renders a headless `<button role="menuitem">`:

```tsx
<div role="menu">
  <ActionMenuItem action="users.view" className="menu-item" />
  <ActionMenuItem action="users.delete" className="menu-item" />
</div>
```

It supports the same action-specific options as `ActionButton`.

### `ActionCommandPalette`

Provides a small accessible React command palette without an external UI dependency:

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
- shows disabled actions but prevents them from running;
- uses `mod+k` as the default opening shortcut.

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

It returns `null` when `process.env.NODE_ENV === 'production'`.

## Hooks

All hooks must be used inside `ActionProvider`.

### `useAction`

Returns the resolved state of one action. It throws `ActionNotFoundError` if the ID does not exist.

```tsx
const deleteAction = useAction('users.delete')
```

### `useActionState`

Works like `useAction`, but returns `null` for an unknown ID:

```tsx
const optionalAction = useActionState(actionId)
```

### `useActions`

Returns resolved actions with optional filters:

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

Returns `true` only when the action exists, is permitted, is visible, and is not disabled:

```tsx
const canDelete = useCanAction('users.delete')
```

### `useRunAction`

Returns the central async action runner:

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

The runner applies the same permission, visibility, disabled, confirmation, execution, navigation, and lifecycle rules as the built-in components.

## Permissions

Pass the current user's granted permissions to the provider:

```tsx
<ActionProvider
  actions={actions}
  context={context}
  permissions={currentUser.permissions}
>
  {children}
</ActionProvider>
```

An action can require one permission:

```tsx
{
  id: 'users.delete',
  label: 'Delete user',
  permission: 'users.delete',
}
```

Or it can require several permissions:

```tsx
{
  id: 'invoices.approve',
  label: 'Approve invoice',
  permission: ['invoices.read', 'invoices.approve'],
  run: ({ invoice, api }) => api.invoices.approve(invoice.id),
}
```

Every listed permission is required.

For custom React permissions or React RBAC logic, pass a checker function:

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

Permission behavior:

- An action without `permission` is allowed by default.
- An action with `permission` is denied if the provider has no `permissions` prop.
- Unauthorized actions are hidden.
- Permissions are checked again when the action runs.

## Confirmation

Add `confirm` to an action that should ask the user before running:

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

Without a custom confirmation function, the browser uses `window.confirm`. The native browser dialog displays the title and description, but it cannot use custom button labels.

Provide your own confirmation UI through `ActionProvider`:

```tsx
<ActionProvider
  actions={actions}
  context={context}
  confirm={(options) =>
    openConfirmationDialog({
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel,
      cancelLabel: options.cancelLabel,
    })
  }
>
  {children}
</ActionProvider>
```

The custom `confirm` function can return a boolean or `Promise<boolean>`.

## Keyboard shortcuts

Add React keyboard shortcuts directly to action definitions:

```tsx
{
  id: 'command.open',
  label: 'Open command',
  shortcut: 'mod+shift+p',
  run: () => openCommand(),
}
```

Supported modifiers:

- `mod`
- `ctrl`
- `meta`
- `shift`
- `alt`

`mod` maps to Command/Meta on Apple platforms and Ctrl elsewhere.

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

If visible actions share a shortcut, development mode logs a warning and `ActionDevTools` reports the conflict. The first runnable matching action in the map handles the shortcut.

## Next.js App Router usage

Place `ActionProvider` in a Client Component. A Server Component can load permissions and pass the serializable permission list into that wrapper.

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

Browser globals are not accessed during render. Shortcut listeners, focus management, default confirmation, and default browser navigation only run on the client. This makes the package suitable for Next.js dashboard actions.

## Styling

The package requires no stylesheet and has no dependency on Tailwind CSS, shadcn/ui, Material UI, Chakra UI, Radix UI, or another design system.

Built-in components accept class names:

```tsx
<ActionButton
  action="users.delete"
  className="action-button"
/>

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

## API reference

### `createActionMap`

Creates an immutable action registry:

```tsx
const actions = createActionMap<AppContext>(definitions)
```

It throws if an action has an empty ID or if two actions use the same ID.

### `ActionDefinition`

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | `string` | Unique, non-empty action identifier |
| `label` | `string \| (context) => string` | User-facing action name |
| `description` | `string \| (context) => string` | Additional action information |
| `group` | `string` | Groups related actions |
| `keywords` | `readonly string[]` | Extra command-palette search terms |
| `shortcut` | `string` | Shortcut such as `mod+k` |
| `permission` | `string \| readonly string[]` | Required permission or permissions |
| `dangerous` | `boolean` | Marks a risky or destructive action |
| `confirm` | `ActionConfirm` | Confirmation content |
| `hidden` | `boolean \| (context) => boolean` | Explicit visibility rule |
| `when` | `(context) => boolean` | Context availability rule |
| `disabled` | `boolean \| (context) => boolean` | Prevents execution while remaining visible |
| `disabledReason` | `string \| (context) => string` | Explains the disabled state |
| `href` | `string \| (context) => string` | Destination after execution |
| `run` | `(context) => void \| Promise<void>` | Action implementation |

An action can use `run`, `href`, or both.

### `ActionProvider`

```tsx
<ActionProvider
  actions={actions}
  context={context}
  permissions={permissions}
  navigate={(href) => router.push(href)}
  confirm={showConfirmation}
  onActionRun={trackAttempt}
  onActionSuccess={trackSuccess}
  onActionError={reportError}
>
  {children}
</ActionProvider>
```

Props:

| Prop | Purpose |
| --- | --- |
| `actions` | Action map created by `createActionMap` |
| `context` | Current data and services passed to actions |
| `permissions` | Granted permission list or checker function |
| `navigate` | Handles resolved `href` values |
| `confirm` | Custom sync or async confirmation function |
| `onActionRun` | Called before confirmation and execution |
| `onActionSuccess` | Called after successful execution and navigation |
| `onActionError` | Called when execution or navigation throws |
| `children` | React content using the action registry |

Without `navigate`, href actions use `window.location.assign` in the browser.

### Component API

#### `ActionButton`

Important props:

- `action`
- `children`
- `className`
- `disabledMode: 'disable' | 'hide'`
- `render`
- native button attributes except controlled action fields

#### `ActionMenuItem`

Accepts the same action-specific props as `ActionButton` and renders `role="menuitem"`.

#### `ActionCommandPalette`

Important props:

- `openShortcut`
- `placeholder`
- `className`
- `overlayClassName`
- `inputClassName`
- `listClassName`
- `itemClassName`
- `noResultsClassName`
- `renderItem`
- `renderEmpty`

#### `ActionDevTools`

Accepts a `position` prop:

```ts
'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
```

### Hook API

```tsx
const state = useAction(id)
const stateOrNull = useActionState(id)
const states = useActions(options)
const canRun = useCanAction(id)
const runAction = useRunAction()
```

### `ResolvedActionState`

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

`canRun` is `true` only when the action is visible and enabled.

### Errors

The central runner can throw:

- `ActionNotFoundError`: the requested ID does not exist;
- `ActionPermissionError`: a required permission is missing;
- `ActionUnavailableError`: the action is hidden or does not match `when`;
- `ActionDisabledError`: the action is disabled;
- an error thrown by `run` or the navigation implementation.

```tsx
import {
  ActionDisabledError,
  ActionPermissionError,
  useRunAction,
} from 'react-actionmap'

function ExportButton() {
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

Built-in buttons, menu items, command-palette items, and shortcuts prevent unhandled promise rejections. Use `ActionProvider.onActionError` to report errors triggered by those surfaces.

### Lower-level utilities

Advanced integrations can also use:

- `evaluateAction`
- `canRunAction`
- `normalizeKey`
- `normalizeShortcut`
- `shortcutToString`
- `matchShortcut`
- `isTypingTarget`
- `detectShortcutConflicts`

Most applications only need `createActionMap`, `ActionProvider`, the hooks, and the built-in components.

### Exported types

The package exports these public TypeScript types:

- `ActionButtonProps`
- `ActionCommandPaletteProps`
- `ActionConfirm`
- `ActionDefinition`
- `ActionDevToolsProps`
- `ActionErrorEvent`
- `ActionMap`
- `ActionMenuItemProps`
- `ActionProviderProps`
- `ActionRunEvent`
- `MaybePromise`
- `ParsedShortcut`
- `PermissionChecker`
- `Resolvable`
- `ResolvedActionState`
- `ResolvedConfirm`
- `RunAction`
- `ShortcutAction`
- `ShortcutConflict`
- `UseActionsOptions`

### Suggested project structure

For a larger app, keep action definitions near their domain:

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

Install repository dependencies:

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
