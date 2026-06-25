'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ActionCommandPalette,
  ActionDevTools,
  ActionProvider,
  createActionMap,
} from 'react-actionmap'

type DashboardActionContext = {
  readonly refresh: () => void
}

const actions = createActionMap<DashboardActionContext>([
  {
    id: 'dashboard.refresh',
    label: 'Refresh dashboard',
    description: 'Reload data rendered by the current route',
    group: 'Dashboard',
    shortcut: 'mod+r',
    permission: 'dashboard.read',
    run: ({ refresh }) => refresh(),
  },
  {
    id: 'settings.open',
    label: 'Open settings',
    group: 'Navigation',
    permission: 'settings.read',
    href: '/settings',
  },
])

type AppActionProviderProps = {
  readonly permissions: readonly string[]
  readonly children: React.ReactNode
}

export function AppActionProvider({
  permissions,
  children,
}: AppActionProviderProps) {
  const router = useRouter()
  const context = useMemo<DashboardActionContext>(
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
      <ActionDevTools />
    </ActionProvider>
  )
}
