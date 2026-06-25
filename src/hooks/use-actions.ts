import type { ResolvedActionState } from '../core/types.js'
import { useActionContext } from '../provider/action-context.js'

export type UseActionsOptions = {
  readonly group?: string
  readonly includeHidden?: boolean
  readonly includeDisabled?: boolean
}

export function useActions(
  options: UseActionsOptions = {},
): ReadonlyArray<ResolvedActionState> {
  const { states } = useActionContext()
  const {
    group,
    includeHidden = false,
    includeDisabled = true,
  } = options

  return states.filter((state: ResolvedActionState): boolean => {
    if (group && state.group !== group) return false
    if (!includeHidden && state.hidden) return false
    if (!includeDisabled && state.disabled) return false
    return true
  })
}
