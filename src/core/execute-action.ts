import type {
  ActionDefinition,
  ActionErrorEvent,
  ActionRunEvent,
  MaybePromise,
  PermissionChecker,
  ResolvedConfirm,
} from './types.js'
import {
  ActionDisabledError,
  ActionPermissionError,
  ActionUnavailableError,
} from './action-errors.js'
import { evaluateAction } from './evaluate-action.js'
import { canRunAction } from '../permissions/can-run-action.js'
import { isBrowser } from '../utils/is-browser.js'

export type ExecuteActionOptions<TContext> = {
  readonly action: ActionDefinition<TContext>
  readonly context: TContext
  readonly permissions?: PermissionChecker<TContext> | undefined
  readonly navigate?: ((href: string) => void) | undefined
  readonly confirm?:
    | ((options: ResolvedConfirm) => MaybePromise<boolean>)
    | undefined
  readonly onActionRun?:
    | ((event: ActionRunEvent<TContext>) => void)
    | undefined
  readonly onActionSuccess?:
    | ((event: ActionRunEvent<TContext>) => void)
    | undefined
  readonly onActionError?:
    | ((event: ActionErrorEvent<TContext>) => void)
    | undefined
}

export async function executeAction<TContext>({
  action,
  context,
  permissions,
  navigate,
  confirm,
  onActionRun,
  onActionSuccess,
  onActionError,
}: ExecuteActionOptions<TContext>): Promise<void> {
  if (!canRunAction(action, permissions, context)) {
    throw new ActionPermissionError(action.id)
  }

  const state = evaluateAction(action, context, permissions)
  if (state.hidden) {
    throw new ActionUnavailableError(action.id)
  }
  if (state.disabled) {
    throw new ActionDisabledError(action.id, state.disabledReason)
  }

  const event: ActionRunEvent<TContext> = {
    action,
    context,
    timestamp: Date.now(),
  }
  onActionRun?.(event)

  if (state.confirm) {
    let confirmed = false

    if (confirm) {
      confirmed = await confirm(state.confirm)
    } else if (isBrowser()) {
      const message = state.confirm.description
        ? `${state.confirm.title}\n\n${state.confirm.description}`
        : state.confirm.title
      confirmed = window.confirm(message)
    }

    if (!confirmed) return
  }

  try {
    await action.run?.(context)

    if (state.href) {
      if (navigate) {
        navigate(state.href)
      } else if (isBrowser()) {
        window.location.assign(state.href)
      }
    }

    onActionSuccess?.(event)
  } catch (error) {
    onActionError?.({
      action,
      context,
      error,
      timestamp: Date.now(),
    })
    throw error
  }
}
