import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import type React from 'react'
import type {
  ActionCommandPaletteProps,
  ResolvedActionState,
} from '../core/types.js'
import { useActionContext } from '../provider/action-context.js'
import { isBrowser } from '../utils/is-browser.js'
import { isTypingTarget, matchShortcut } from '../keyboard/match-shortcut.js'

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '12vh 16px 16px',
  background: 'rgba(0, 0, 0, 0.35)',
}

const dialogStyle: React.CSSProperties = {
  width: 'min(560px, 100%)',
  maxHeight: '70vh',
  overflow: 'hidden',
  border: '1px solid rgba(127, 127, 127, 0.35)',
  borderRadius: 10,
  background: 'Canvas',
  color: 'CanvasText',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
}

const inputStyle: React.CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  padding: '14px 16px',
  border: 0,
  borderBottom: '1px solid rgba(127, 127, 127, 0.25)',
  outline: 0,
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
}

const listStyle: React.CSSProperties = {
  maxHeight: '55vh',
  overflowY: 'auto',
  padding: 6,
  margin: 0,
  listStyle: 'none',
}

const itemStyle: React.CSSProperties = {
  boxSizing: 'border-box',
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '10px 12px',
  border: 0,
  borderRadius: 6,
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  textAlign: 'left',
}

function matchesQuery(
  state: ResolvedActionState,
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) return true

  return [
    state.id,
    state.label,
    state.description,
    state.group,
    ...(state.keywords ?? []),
  ]
    .filter((value): value is string => value !== undefined)
    .some((value) => value.toLowerCase().includes(normalizedQuery))
}

export function ActionCommandPalette({
  openShortcut = 'mod+k',
  placeholder = 'Search actions…',
  className,
  overlayClassName,
  inputClassName,
  listClassName,
  itemClassName,
  noResultsClassName,
  renderItem,
  renderEmpty,
}: ActionCommandPaletteProps): React.ReactElement | null {
  const actionContext = useActionContext()
  const [open, setOpen] = useState<boolean>(false)
  const [query, setQuery] = useState<string>('')
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId: string = useId()

  const visibleActions: ReadonlyArray<ResolvedActionState> = useMemo(
    () =>
      actionContext.states.filter(
        (state: ResolvedActionState): boolean => !state.hidden,
      ),
    [actionContext],
  )

  const filteredActions: ReadonlyArray<ResolvedActionState> = useMemo(() => {
    const normalizedQuery: string = query.trim().toLowerCase()
    return visibleActions.filter((state: ResolvedActionState): boolean =>
      matchesQuery(state, normalizedQuery),
    )
  }, [query, visibleActions])

  useEffect(() => {
    if (!isBrowser()) return

    const handleGlobalKeyDown = (event: KeyboardEvent): void => {
      if (
        matchShortcut(openShortcut, event) &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault()
        event.stopImmediatePropagation()
        setOpen(true)
        return
      }

      if (open && event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown, true)
    return () =>
      window.removeEventListener('keydown', handleGlobalKeyDown, true)
  }, [open, openShortcut])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActiveIndex(0)
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    setActiveIndex((current) =>
      Math.min(current, Math.max(filteredActions.length - 1, 0)),
    )
  }, [filteredActions.length])

  const selectAction = async (
    state: ResolvedActionState,
  ): Promise<void> => {
    if (!state.canRun) return

    setOpen(false)
    try {
      await actionContext.runAction(state.id)
    } catch {
      // Errors are reported through ActionProvider.onActionError.
    }
  }

  const handleInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) =>
        filteredActions.length === 0
          ? 0
          : (current + 1) % filteredActions.length,
      )
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) =>
        filteredActions.length === 0
          ? 0
          : (current - 1 + filteredActions.length) %
            filteredActions.length,
      )
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const selected = filteredActions[activeIndex]
      if (selected) void selectAction(selected)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  if (!open) return null

  const activeAction: ResolvedActionState | undefined =
    filteredActions[activeIndex]

  return (
    <div
      className={overlayClassName}
      style={overlayStyle}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) setOpen(false)
      }}
      data-actionmap-overlay=""
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Action command palette"
        className={className}
        style={dialogStyle}
      >
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeAction ? `${listId}-${activeAction.id}` : undefined
          }
          value={query}
          placeholder={placeholder}
          className={inputClassName}
          style={inputStyle}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={handleInputKeyDown}
        />

        <ul
          id={listId}
          role="listbox"
          aria-label="Actions"
          className={listClassName}
          style={listStyle}
        >
          {filteredActions.map((state, index) => {
            const isActive = index === activeIndex
            return (
              <li key={state.id}>
                <button
                  id={`${listId}-${state.id}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  aria-disabled={!state.canRun}
                  disabled={!state.canRun}
                  className={itemClassName}
                  style={{
                    ...itemStyle,
                    background: isActive
                      ? 'rgba(127, 127, 127, 0.16)'
                      : 'transparent',
                    cursor: state.canRun ? 'pointer' : 'not-allowed',
                    opacity: state.canRun ? 1 : 0.55,
                  }}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => void selectAction(state)}
                  data-action-id={state.id}
                  data-action-group={state.group}
                  data-dangerous={String(state.dangerous)}
                  data-disabled={String(!state.canRun)}
                  data-hidden="false"
                >
                  {renderItem ? (
                    renderItem(state, isActive)
                  ) : (
                    <>
                      <span>
                        <span style={{ display: 'block' }}>
                          {state.label}
                        </span>
                        {state.description ? (
                          <small style={{ opacity: 0.7 }}>
                            {state.description}
                          </small>
                        ) : null}
                      </span>
                      {state.shortcut ? (
                        <kbd style={{ opacity: 0.7 }}>
                          {state.shortcut}
                        </kbd>
                      ) : null}
                    </>
                  )}
                </button>
              </li>
            )
          })}

          {filteredActions.length === 0 ? (
            <li
              className={noResultsClassName}
              style={{ padding: 16, textAlign: 'center', opacity: 0.7 }}
            >
              {renderEmpty ? renderEmpty() : 'No actions found.'}
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}
