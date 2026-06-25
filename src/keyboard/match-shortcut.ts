import {
  isMacPlatform,
  normalizeKey,
  normalizeShortcut,
} from './normalize-shortcut.js'

export function matchShortcut(
  shortcut: string,
  event: KeyboardEvent,
): boolean {
  const parsed = normalizeShortcut(shortcut)
  const isMac = isMacPlatform()
  const needsCtrl = parsed.ctrl || (parsed.mod && !isMac)
  const needsMeta = parsed.meta || (parsed.mod && isMac)

  return (
    needsCtrl === event.ctrlKey &&
    needsMeta === event.metaKey &&
    parsed.shift === event.shiftKey &&
    parsed.alt === event.altKey &&
    normalizeKey(event.key) === parsed.key
  )
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (
    typeof HTMLElement === 'undefined' ||
    !(target instanceof HTMLElement)
  ) {
    return false
  }

  const tagName = target.tagName.toLowerCase()
  if (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  ) {
    return true
  }

  return (
    target.isContentEditable ||
    target.closest('[contenteditable="true"], [contenteditable=""]') !== null
  )
}
