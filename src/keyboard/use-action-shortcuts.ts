import { useEffect } from 'react'
import type { ResolvedActionState } from '../core/types.js'
import { useOptionalActionContext } from '../provider/action-context.js'
import { isBrowser } from '../utils/is-browser.js'
import { isTypingTarget, matchShortcut } from './match-shortcut.js'
import { detectShortcutConflicts } from './shortcut-conflicts.js'

export function useActionShortcuts(): void {
  const actionContext = useOptionalActionContext()

  useEffect((): (() => void) | undefined => {
    if (!actionContext || !isBrowser()) return undefined

    if (process.env.NODE_ENV !== 'production') {
      const visibleActionIds = new Set<string>(
        actionContext.states
          .filter(
            (state: ResolvedActionState): boolean => !state.hidden,
          )
          .map((state: ResolvedActionState): string => state.id),
      )
      const conflicts = detectShortcutConflicts(
        actionContext.states,
        visibleActionIds,
      )

      if (conflicts.length > 0) {
        console.warn(
          '[react-actionmap] Shortcut conflicts detected:',
          conflicts
            .map(
              (conflict): string =>
                `${conflict.shortcut} -> [${conflict.actions.join(', ')}]`,
            )
            .join('; '),
        )
      }
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (isTypingTarget(event.target)) return

      const matchingAction: ResolvedActionState | undefined =
        actionContext.states.find(
          (state: ResolvedActionState): boolean =>
            Boolean(
              state.shortcut &&
                state.canRun &&
                matchShortcut(state.shortcut, event),
            ),
        )

      if (!matchingAction) return

      event.preventDefault()
      void actionContext.runAction(matchingAction.id).catch(() => undefined)
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [actionContext])
}
