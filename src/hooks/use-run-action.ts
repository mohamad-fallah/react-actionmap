import { useActionContext } from '../provider/action-context.js'

export type RunAction = (id: string) => Promise<void>

export function useRunAction(): RunAction {
  return useActionContext().runAction
}
