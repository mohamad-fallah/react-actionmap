import type { ResolvedActionState } from '../core/types.js'
import { useActionContext } from '../provider/action-context.js'

export function useCanAction(id: string): boolean {
  const state: ResolvedActionState | undefined =
    useActionContext().getActionState(id)
  return state?.canRun ?? false
}
