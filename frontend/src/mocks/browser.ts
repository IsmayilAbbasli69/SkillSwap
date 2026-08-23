import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { resetMockState } from './state'

export const worker = setupWorker(...handlers)

if (import.meta.env.DEV) {
  Object.assign(window, { resetMockState })
}
