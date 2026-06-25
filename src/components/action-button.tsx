import { useState } from 'react'
import type React from 'react'
import type { ActionButtonProps } from '../core/types.js'
import { ActionNotFoundError } from '../core/action-errors.js'
import { useActionContext } from '../provider/action-context.js'

export function ActionButton({
  action: actionId,
  children,
  className,
  disabledMode = 'disable',
  render,
  onClick,
  ...buttonProps
}: ActionButtonProps): React.ReactElement | null {
  const actionContext = useActionContext()
  const [pending, setPending] = useState<boolean>(false)
  const state = actionContext.getActionState(actionId)

  if (!state) {
    if (process.env.NODE_ENV !== 'production') {
      throw new ActionNotFoundError(actionId)
    }
    return null
  }

  if (state.hidden || (state.disabled && disabledMode === 'hide')) {
    return null
  }

  if (render) return <>{render(state)}</>

  const handleClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ): Promise<void> => {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      pending ||
      state.disabled
    ) {
      return
    }

    setPending(true)
    try {
      await actionContext.runAction(actionId)
    } catch {
      // Errors are reported through ActionProvider.onActionError.
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      {...buttonProps}
      type={buttonProps.type ?? 'button'}
      className={className}
      disabled={state.disabled || pending}
      onClick={handleClick}
      data-action-id={state.id}
      data-action-group={state.group}
      data-dangerous={String(state.dangerous)}
      data-disabled={String(state.disabled || pending)}
      data-hidden="false"
      aria-label={buttonProps['aria-label'] ?? state.label}
      aria-busy={pending || undefined}
      title={
        buttonProps.title ??
        (state.disabled ? state.disabledReason : state.description)
      }
    >
      {children ?? state.label}
    </button>
  )
}
