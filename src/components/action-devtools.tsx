import type React from 'react'
import type {
  ActionDevToolsProps,
  ResolvedActionState,
} from '../core/types.js'
import { detectShortcutConflicts } from '../keyboard/shortcut-conflicts.js'
import { useActionContext } from '../provider/action-context.js'

const positionStyles: Readonly<
  Record<
    NonNullable<ActionDevToolsProps['position']>,
    React.CSSProperties
  >
> = {
  'bottom-right': { right: 12, bottom: 12 },
  'bottom-left': { left: 12, bottom: 12 },
  'top-right': { right: 12, top: 12 },
  'top-left': { left: 12, top: 12 },
}

export function ActionDevTools({
  position = 'bottom-right',
}: ActionDevToolsProps): React.ReactElement | null {
  const actionContext = useActionContext()

  if (process.env.NODE_ENV === 'production') return null

  const states: ReadonlyArray<ResolvedActionState> = actionContext.states
  const visibleIds = new Set<string>(
    states
      .filter((state: ResolvedActionState): boolean => !state.hidden)
      .map((state: ResolvedActionState): string => state.id),
  )
  const conflicts = detectShortcutConflicts(states, visibleIds)
  const dangerousWithoutConfirmation: ReadonlyArray<ResolvedActionState> =
    states.filter(
      (state: ResolvedActionState): boolean =>
        state.dangerous && !state.confirm,
    )
  const actionsWithoutHandler: ReadonlyArray<ResolvedActionState> =
    states.filter(
      (state: ResolvedActionState): boolean =>
        !state.hasRun && !state.hasHref,
    )

  const rows: ReadonlyArray<readonly [string, number]> = [
    ['Total', states.length],
    [
      'Visible',
      states.filter(
        (state: ResolvedActionState): boolean => !state.hidden,
      ).length,
    ],
    [
      'Hidden',
      states.filter(
        (state: ResolvedActionState): boolean => state.hidden,
      ).length,
    ],
    [
      'Disabled',
      states.filter(
        (state: ResolvedActionState): boolean => state.disabled,
      ).length,
    ],
    [
      'Dangerous',
      states.filter(
        (state: ResolvedActionState): boolean => state.dangerous,
      ).length,
    ],
    ['Dangerous without confirm', dangerousWithoutConfirmation.length],
    ['Shortcut conflicts', conflicts.length],
    ['Without run or href', actionsWithoutHandler.length],
  ]

  return (
    <aside
      aria-label="react-actionmap development tools"
      data-actionmap-devtools=""
      style={{
        position: 'fixed',
        zIndex: 9998,
        width: 260,
        maxHeight: '60vh',
        overflow: 'auto',
        padding: 10,
        border: '1px solid rgba(127, 127, 127, 0.35)',
        borderRadius: 8,
        background: 'Canvas',
        color: 'CanvasText',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.18)',
        font: '12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
        ...positionStyles[position],
      }}
    >
      <strong style={{ display: 'block', marginBottom: 8 }}>
        react-actionmap
      </strong>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '4px 10px',
          margin: 0,
        }}
      >
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: 'contents' }}>
            <dt>{label}</dt>
            <dd style={{ margin: 0, textAlign: 'right' }}>{value}</dd>
          </div>
        ))}
      </dl>

      {conflicts.length > 0 ? (
        <details style={{ marginTop: 8 }}>
          <summary>Conflicts</summary>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {conflicts.map((conflict) => (
              <li key={conflict.shortcut}>
                {conflict.shortcut}: {conflict.actions.join(', ')}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {dangerousWithoutConfirmation.length > 0 ? (
        <details style={{ marginTop: 8 }}>
          <summary>Unsafe dangerous actions</summary>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {dangerousWithoutConfirmation.map(
              (state: ResolvedActionState) => (
                <li key={state.id}>{state.id}</li>
              ),
            )}
          </ul>
        </details>
      ) : null}

      {actionsWithoutHandler.length > 0 ? (
        <details style={{ marginTop: 8 }}>
          <summary>Actions without handlers</summary>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {actionsWithoutHandler.map(
              (state: ResolvedActionState) => (
                <li key={state.id}>{state.id}</li>
              ),
            )}
          </ul>
        </details>
      ) : null}
    </aside>
  )
}
