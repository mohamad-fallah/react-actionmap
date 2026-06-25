import { createContext, useContext } from 'react'
import type { ResolvedActionState } from '../core/types.js'

export type ActionContextValue = {
  readonly states: ReadonlyArray<ResolvedActionState>
  readonly getActionState: (
    id: string,
  ) => ResolvedActionState | undefined
  readonly runAction: (id: string) => Promise<void>
}

export const ActionContext = createContext<ActionContextValue | null>(null)

export function useActionContext(): ActionContextValue {
  const value = useContext(ActionContext)
  if (!value) {
    throw new Error(
      '[react-actionmap] This API must be used inside <ActionProvider>.',
    )
  }

  return value
}

export function useOptionalActionContext(): ActionContextValue | null {
  return useContext(ActionContext)
}
