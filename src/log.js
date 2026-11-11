import sos from '@signageos/front-applet'

/**
 * Send a log entry to SignageOS, visible in Flyo under
 * Integration > Bildschirme > Info > "Logs anzeigen".
 *
 * - `type` is required: letters, numbers, dot, dash and underscore only, max 100 chars
 *   (e.g. Flyo.LoadFailed, Content.CacheFailed).
 * - SignageOS throttles to ~30 entries per 30 seconds, so log events (errors, retries),
 *   not every slide change.
 * - Pass errors as String(error), an Error object is not transferred as a readable message.
 *
 * Logging must never interrupt the applet, not even with an invalid type
 * or when running locally without SignageOS.
 */
export function log(entry) {
  console.log('[log]', entry)
  Promise.resolve()
    .then(() => sos.command.dispatch(entry))
    .catch(() => {})
}
