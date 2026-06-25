import type { ActionDefinition, PermissionChecker } from '../core/types.js'

export function canRunAction<TContext>(
  action: ActionDefinition<TContext>,
  permissions: PermissionChecker<TContext> | undefined,
  context: TContext,
): boolean {
  if (action.permission === undefined) return true
  if (permissions === undefined) return false

  const requiredPermissions =
    typeof action.permission === 'string'
      ? [action.permission]
      : action.permission

  if (typeof permissions === 'function') {
    return requiredPermissions.every((permission) =>
      permissions(permission, context),
    )
  }

  return requiredPermissions.every((permission) =>
    permissions.includes(permission),
  )
}
