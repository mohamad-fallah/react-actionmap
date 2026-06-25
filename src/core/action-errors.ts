export class ActionNotFoundError extends Error {
  constructor(id: string) {
    super(`[react-actionmap] Action "${id}" was not found.`)
    this.name = 'ActionNotFoundError'
  }
}

export class ActionPermissionError extends Error {
  constructor(id: string) {
    super(`[react-actionmap] Action "${id}" cannot run: permission denied.`)
    this.name = 'ActionPermissionError'
  }
}

export class ActionUnavailableError extends Error {
  constructor(id: string) {
    super(`[react-actionmap] Action "${id}" is currently hidden or unavailable.`)
    this.name = 'ActionUnavailableError'
  }
}

export class ActionDisabledError extends Error {
  constructor(id: string, reason?: string) {
    const detail = reason ? ` ${reason}` : ''
    super(`[react-actionmap] Action "${id}" is disabled.${detail}`)
    this.name = 'ActionDisabledError'
  }
}
