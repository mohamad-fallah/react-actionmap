import type { Resolvable } from '../core/types.js'

function isResolver<TValue, TContext>(
  value: Resolvable<TValue, TContext>,
): value is (context: TContext) => TValue {
  return typeof value === 'function'
}

export function resolveValue<TValue, TContext>(
  value: Resolvable<TValue, TContext>,
  context: TContext,
): TValue {
  return isResolver(value) ? value(context) : value
}
