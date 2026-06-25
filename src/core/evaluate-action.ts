import type {
  ActionDefinition,
  PermissionChecker,
  ResolvedActionState,
  ResolvedConfirm,
} from './types.js'
import { canRunAction } from '../permissions/can-run-action.js'
import { resolveValue } from '../utils/resolve-value.js'

export function evaluateAction<TContext>(
  action: ActionDefinition<TContext>,
  context: TContext,
  permissions: PermissionChecker<TContext> | undefined,
): ResolvedActionState {
  const hasPermission = canRunAction(action, permissions, context)
  const matchesContext = action.when ? action.when(context) : true
  const explicitlyHidden =
    action.hidden === undefined ? false : resolveValue(action.hidden, context)
  const hidden = !hasPermission || !matchesContext || explicitlyHidden

  const disabled =
    action.disabled === undefined
      ? false
      : resolveValue(action.disabled, context)

  const resolvedConfirm: ResolvedConfirm | undefined = action.confirm
    ? {
        title: resolveValue(action.confirm.title, context),
        description:
          action.confirm.description === undefined
            ? undefined
            : resolveValue(action.confirm.description, context),
        confirmLabel:
          action.confirm.confirmLabel === undefined
            ? undefined
            : resolveValue(action.confirm.confirmLabel, context),
        cancelLabel:
          action.confirm.cancelLabel === undefined
            ? undefined
            : resolveValue(action.confirm.cancelLabel, context),
      }
    : undefined

  return {
    id: action.id,
    label: resolveValue(action.label, context),
    description:
      action.description === undefined
        ? undefined
        : resolveValue(action.description, context),
    group: action.group,
    keywords: action.keywords,
    shortcut: action.shortcut,
    permission: action.permission,
    dangerous: action.dangerous ?? false,
    confirm: resolvedConfirm,
    hidden,
    disabled,
    disabledReason:
      disabled && action.disabledReason !== undefined
        ? resolveValue(action.disabledReason, context)
        : undefined,
    href:
      action.href === undefined ? undefined : resolveValue(action.href, context),
    hasHref: action.href !== undefined,
    hasRun: action.run !== undefined,
    canRun: !hidden && !disabled,
  }
}
