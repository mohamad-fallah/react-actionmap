'use client'

import { ActionButton, ActionMenuItem } from 'react-actionmap'

export function DashboardActions() {
  return (
    <>
      <ActionButton action="dashboard.refresh" />
      <div role="menu" aria-label="Dashboard navigation">
        <ActionMenuItem action="settings.open" />
      </div>
    </>
  )
}
