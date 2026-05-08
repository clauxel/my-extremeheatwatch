import { handleAnalytics } from '../../worker/index.js'

export function onRequest(context) {
  return handleAnalytics(context.request, context.env, new URL(context.request.url))
}
