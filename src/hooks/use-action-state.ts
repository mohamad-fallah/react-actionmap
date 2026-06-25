import type { ResolvedActionState } from '../core/types.js'
import { useActionContext } from '../provider/action-context.js'

export function useActionState(
  id: string,
): ResolvedActionState | null {
  return useActionContext().getActionState(id) ?? null
}
