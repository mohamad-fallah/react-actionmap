export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[react-actionmap] ${message}`)
  }
}
