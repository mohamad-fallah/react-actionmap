export type ParsedShortcut = {
  readonly key: string
  readonly ctrl: boolean
  readonly meta: boolean
  readonly shift: boolean
  readonly alt: boolean
  readonly mod: boolean
}

const KEY_ALIASES: Readonly<Record<string, string>> = {
  backspace: 'Backspace',
  delete: 'Delete',
  del: 'Delete',
  enter: 'Enter',
  return: 'Enter',
  escape: 'Escape',
  esc: 'Escape',
  tab: 'Tab',
  space: ' ',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown',
}

export function normalizeKey(key: string): string {
  const normalized = key.trim().toLowerCase()
  const alias = KEY_ALIASES[normalized]
  if (alias !== undefined) return alias
  return normalized.length === 1 ? normalized : key.trim()
}

export function normalizeShortcut(shortcut: string): ParsedShortcut {
  const parts = shortcut
    .split('+')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
  const key = parts[parts.length - 1] ?? ''
  const modifiers = new Set(parts.slice(0, -1))

  return {
    key: normalizeKey(key),
    ctrl: modifiers.has('ctrl'),
    meta: modifiers.has('meta'),
    shift: modifiers.has('shift'),
    alt: modifiers.has('alt'),
    mod: modifiers.has('mod'),
  }
}

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false

  const userAgentData = navigator.userAgent
  return /mac|iphone|ipad|ipod/i.test(
    `${navigator.platform} ${userAgentData}`,
  )
}

export function shortcutToString(shortcut: ParsedShortcut): string {
  const parts: string[] = []
  if (shortcut.mod) parts.push('mod')
  if (shortcut.ctrl) parts.push('ctrl')
  if (shortcut.meta) parts.push('meta')
  if (shortcut.alt) parts.push('alt')
  if (shortcut.shift) parts.push('shift')
  parts.push(shortcut.key.toLowerCase())
  return parts.join('+')
}
