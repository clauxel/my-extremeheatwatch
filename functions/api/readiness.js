import { handleReadiness } from '../../worker/index.js'

export function onRequest(context) {
  return handleReadiness(context.request, context.env, new URL(context.request.url))
}
