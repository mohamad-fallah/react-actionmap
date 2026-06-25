import { ActionNotFoundError } from '../core/action-errors.js'
import type { ResolvedActionState } from '../core/types.js'
import { useActionContext } from '../provider/action-context.js'

export function useAction(id: string): ResolvedActionState {
  const state: ResolvedActionState | undefined =
    useActionContext().getActionState(id)

  if (!state) throw new ActionNotFoundError(id)
  return state
}
