import type React from 'react'

export type MaybePromise<T> = T | Promise<T>

export type Resolvable<T, TContext> = T | ((context: TContext) => T)

export type ActionConfirm<TContext> = {
  readonly title: Resolvable<string, TContext>
  readonly description?: Resolvable<string, TContext>
  readonly confirmLabel?: Resolvable<string, TContext>
  readonly cancelLabel?: Resolvable<string, TContext>
}

export type ActionDefinition<TContext> = {
  readonly id: string
  readonly label: Resolvable<string, TContext>
  readonly description?: Resolvable<string, TContext>
  readonly group?: string
  readonly keywords?: readonly string[]
  readonly shortcut?: string
  readonly permission?: string | readonly string[]
  readonly dangerous?: boolean
  readonly confirm?: ActionConfirm<TContext>
  readonly hidden?: Resolvable<boolean, TContext>
  readonly disabled?: Resolvable<boolean, TContext>
  readonly disabledReason?: Resolvable<string, TContext>
  readonly when?: (context: TContext) => boolean
  readonly href?: Resolvable<string, TContext>
  readonly run?: (context: TContext) => MaybePromise<void>
}

export type ActionMap<TContext> = {
  readonly _definitions: ReadonlyArray<ActionDefinition<TContext>>
}

export type ResolvedConfirm = {
  readonly title: string
  readonly description: string | undefined
  readonly confirmLabel: string | undefined
  readonly cancelLabel: string | undefined
}

export type ResolvedActionState = {
  readonly id: string
  readonly label: string
  readonly description: string | undefined
  readonly group: string | undefined
  readonly keywords: readonly string[] | undefined
  readonly shortcut: string | undefined
  readonly permission: string | readonly string[] | undefined
  readonly dangerous: boolean
  readonly confirm: ResolvedConfirm | undefined
  readonly hidden: boolean
  readonly disabled: boolean
  readonly disabledReason: string | undefined
  readonly href: string | undefined
  readonly hasHref: boolean
  readonly hasRun: boolean
  readonly canRun: boolean
}

export type ActionRunEvent<TContext> = {
  readonly action: ActionDefinition<TContext>
  readonly context: TContext
  readonly timestamp: number
}

export type ActionErrorEvent<TContext> = {
  readonly action: ActionDefinition<TContext>
  readonly context: TContext
  readonly error: unknown
  readonly timestamp: number
}

export type PermissionChecker<TContext> =
  | readonly string[]
  | ((permission: string, context: TContext) => boolean)

export type ActionProviderProps<TContext> = {
  readonly actions: ActionMap<TContext>
  readonly context: TContext
  readonly permissions?: PermissionChecker<TContext> | undefined
  readonly navigate?: ((href: string) => void) | undefined
  readonly confirm?:
    | ((confirmOptions: ResolvedConfirm) => MaybePromise<boolean>)
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
  readonly children: React.ReactNode
}

type SharedActionComponentProps = {
  readonly action: string
  readonly children?: React.ReactNode
  readonly className?: string
  readonly disabledMode?: 'disable' | 'hide'
  readonly render?: (state: ResolvedActionState) => React.ReactNode
  readonly onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export type ActionButtonProps = SharedActionComponentProps &
  Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'className' | 'disabled' | 'onClick'
  >

export type ActionMenuItemProps = SharedActionComponentProps &
  Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'className' | 'disabled' | 'onClick' | 'role'
  >

export type ActionCommandPaletteProps = {
  readonly openShortcut?: string
  readonly placeholder?: string
  readonly className?: string
  readonly overlayClassName?: string
  readonly inputClassName?: string
  readonly listClassName?: string
  readonly itemClassName?: string
  readonly noResultsClassName?: string
  readonly renderItem?: (
    state: ResolvedActionState,
    isActive: boolean,
  ) => React.ReactNode
  readonly renderEmpty?: () => React.ReactNode
}

export type ActionDevToolsProps = {
  readonly position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}
