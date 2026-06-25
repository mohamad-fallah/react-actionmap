import { useCallback, useMemo } from 'react'
import type React from 'react'
import { ActionNotFoundError } from '../core/action-errors.js'
import { evaluateAction } from '../core/evaluate-action.js'
import { executeAction } from '../core/execute-action.js'
import type {
  ActionDefinition,
  ActionProviderProps,
  ResolvedActionState,
} from '../core/types.js'
import { useActionShortcuts } from '../keyboard/use-action-shortcuts.js'
import { ActionContext } from './action-context.js'
import type { ActionContextValue } from './action-context.js'

function ActionShortcutManager(): null {
  useActionShortcuts()
  return null
}

export function ActionProvider<TContext>({
  actions,
  context,
  permissions,
  navigate,
  confirm,
  onActionRun,
  onActionSuccess,
  onActionError,
  children,
}: ActionProviderProps<TContext>): React.ReactElement {
  const definitions: ReadonlyArray<ActionDefinition<TContext>> =
    actions._definitions

  const getAction = useCallback(
    (id: string): ActionDefinition<TContext> | undefined =>
      definitions.find(
        (definition: ActionDefinition<TContext>) =>
          definition.id === id,
      ),
    [definitions],
  )

  const states: ReadonlyArray<ResolvedActionState> = useMemo(
    () =>
      definitions.map((definition: ActionDefinition<TContext>) =>
        evaluateAction(definition, context, permissions),
      ),
    [context, definitions, permissions],
  )

  const getActionState = useCallback(
    (id: string): ResolvedActionState | undefined =>
      states.find((state: ResolvedActionState) => state.id === id),
    [states],
  )

  const runAction = useCallback(
    async (id: string): Promise<void> => {
      const action: ActionDefinition<TContext> | undefined = getAction(id)
      if (!action) throw new ActionNotFoundError(id)

      await executeAction({
        action,
        context,
        permissions,
        navigate,
        confirm,
        onActionRun,
        onActionSuccess,
        onActionError,
      })
    },
    [
      confirm,
      context,
      getAction,
      navigate,
      onActionError,
      onActionRun,
      onActionSuccess,
      permissions,
    ],
  )

  const value: ActionContextValue = useMemo(
    () => ({
      states,
      getActionState,
      runAction,
    }),
    [getActionState, runAction, states],
  )

  return (
    <ActionContext.Provider value={value}>
      <ActionShortcutManager />
      {children}
    </ActionContext.Provider>
  )
}
