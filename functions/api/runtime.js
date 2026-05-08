import { handleRuntime } from '../../worker/index.js'

export function onRequest(context) {
  return handleRuntime(new URL(context.request.url))
}
