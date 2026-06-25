import {
  normalizeShortcut,
  shortcutToString,
} from './normalize-shortcut.js'

export type ShortcutAction = {
  readonly id: string
  readonly shortcut?: string | undefined
}

export type ShortcutConflict = {
  readonly shortcut: string
  readonly actions: ReadonlyArray<string>
}

export function detectShortcutConflicts(
  actions: ReadonlyArray<ShortcutAction>,
  visibleIds?: ReadonlySet<string>,
): ReadonlyArray<ShortcutConflict> {
  const shortcutMap = new Map<string, string[]>()

  for (const action of actions) {
    if (!action.shortcut) continue
    if (visibleIds && !visibleIds.has(action.id)) continue

    const normalized: string = shortcutToString(
      normalizeShortcut(action.shortcut),
    )
    const existing: string[] = shortcutMap.get(normalized) ?? []
    existing.push(action.id)
    shortcutMap.set(normalized, existing)
  }

  const conflicts: ShortcutConflict[] = []
  for (const [shortcut, actionIds] of shortcutMap) {
    if (actionIds.length > 1) {
      conflicts.push({
        shortcut,
        actions: Object.freeze([...actionIds]),
      })
    }
  }

  return Object.freeze(conflicts)
}
