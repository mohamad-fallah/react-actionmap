import type { ActionDefinition, ActionMap } from './types.js'
import { invariant } from '../utils/invariant.js'

export function createActionMap<TContext>(
  definitions: ReadonlyArray<ActionDefinition<TContext>>,
): ActionMap<TContext> {
  const ids = new Set<string>()

  const immutableDefinitions: ReadonlyArray<ActionDefinition<TContext>> =
    definitions.map((definition): ActionDefinition<TContext> => {
      invariant(
        typeof definition.id === 'string' &&
          definition.id.trim().length > 0,
        'Each action must have a non-empty string id.',
      )
      invariant(
        !ids.has(definition.id),
        `Duplicate action id: "${definition.id}".`,
      )
      ids.add(definition.id)

      const immutableDefinition: ActionDefinition<TContext> = Object.freeze({
        ...definition,
        ...(definition.keywords
          ? { keywords: Object.freeze([...definition.keywords]) }
          : {}),
        ...(definition.confirm
          ? { confirm: Object.freeze({ ...definition.confirm }) }
          : {}),
      })
      return immutableDefinition
    })

  return Object.freeze({
    _definitions: Object.freeze(immutableDefinitions),
  })
}
