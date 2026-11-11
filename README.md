# Vue 2 SOS Applet

## Development:

+ For local development, [uncomment SOS code](https://github.com/flyocloud/signageos-vue2-example/pull/1/files) then `npm run serve`
+ For preview in emulator use `npm run dev` and run `npm run start` afterwards. Each change requires you to restart the applet

## Setup (Once)

> This step must be done once after cloning (setting up) your signageos applet repository.

+ Ensure you have an active https://box.signageos.io account!
+ `npm install @signageos/cli -g` now the `sos` is gloabally available
+ `sos login`
+ `sos organization set-default`

## Error handling and logs

Screens run unattended for weeks, so the applet catches errors and logs them to SignageOS. Flyo shows these entries per screen: open the integration, tab «Bildschirme», info icon next to a screen, «Logs anzeigen» (last 7 days, newest first, max 30).

+ Use `log({ type: 'Area.Event', ... })` from [src/log.js](src/log.js). It never throws, also not locally without SignageOS.
+ `type`: letters, numbers, dot, dash and underscore only, max 100 characters. Add context (url, status, reason) and pass errors as `String(error)`.
+ Only log when something goes wrong. A screen that works must not write a single log entry, otherwise the log stream fills up and the real errors get lost. SignageOS also throttles to about 30 entries per 30 seconds. Never log slide changes, a regular video end or a successful load.
+ A failed API load is retried every 10 seconds, at most 15 times (`RETRY_DELAY` / `MAX_RETRIES` in [src/App.vue](src/App.vue)), with the progress shown on screen. After the last attempt the message stays until Flyo reloads the applet or the device restarts.

| type | When | Fields |
| --- | --- | --- |
| `Flyo.LoadFailed` | Loading the API failed (no connection, timeout, HTTP error, invalid response) | url, status, attempt, message |
| `Content.CacheFailed` | A file could not be cached via `sos.offline.cache.loadOrSaveFile`, the slide is skipped | url, message |
| `Video.LoadFailed` | A cached video could not be loaded into memory, the slide is skipped (logged once) | url, message |
| `Video.Ended` | A video stopped because of an error (`error`, `play-rejected: ...`), never on a regular end | url, reason, isActive, currentTime, errorCode |
| `Applet.Error` | Uncaught error in a Vue component | info, message |
| `Applet.UnhandledRejection` | Unhandled promise rejection | message |

## Video playback

Videos work out of the box: map a video file (`.mp4` or `.webm`) to the image field in Flyo. The applet detects it by the file extension ([src/media.js](src/media.js)) and plays it muted, full screen, once, then moves on to the next slide. A playlist with a single video loops it.

Learnings from production screens (Tizen and other embedded webviews), see the comments in [src/App.vue](src/App.vue) and [src/components/Carouseltem.vue](src/components/Carouseltem.vue):

+ Videos are fetched from the offline cache once and played from a `blob:` URL. The cache's service worker answers Range requests with a full 200, which makes Safari-based webviews freeze a few frames in.
+ `play()` is only called once the video reports `canplay`, otherwise it can fail silently.
+ Slides switch by z-index and only the outgoing slide fades out. Video slides are never faded: decoders don't reliably paint a `<video>` whose opacity is animated, and fading in the incoming slide let paused videos flash through.
+ Don't put the `<video>` on its own GPU layer (`translateZ(0)`), on Tizen it then renders behind the page.
+ A video slide advances on its `ended` event. The slide timer is only a safety net (configured timeout, but at least 60 seconds).
+ Every video is held in memory as a blob while the applet runs, keep video files reasonably small.

## Important Notes

+ Use es5 check `"es5": "npx es-check es5 dist/**/*.js"` via `npm run es5` (build the project first using `npm run build` otherwise the dist folder is empty)
+ Don't use vue3
+ Remove `type="module"` from index.html if present in dist or public folder
+ When having problems with preview emulator, log in into the box and remove all applets from the emulator first, then run `npm run dev` and `npm run start` afterwards.
+ (Seems to be fixed) Box applet error `entry file not found` "solution": add or remove a space at the end of any line in the package.json file then build and reuoload again.
