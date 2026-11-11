<template>
  <div class="loading" v-if="isLoading">
    <div class="logo">
      <img width="200" class="blob" src="flyo.svg" />
    </div>
    <div class="status" v-if="statusMessage">{{ statusMessage }}</div>
  </div>
  <div class="carousel" v-else>
    <div
      v-for="(slide, index) in slides"
      :key="`${index}${slide.entity_id}`"
      class="carousel__item"
      :class="{
        'carousel__item--active': activeIndex === index,
        'carousel__item--leaving': leavingIndex === index,
        'carousel__item--video': slide.isVideo
      }"
    >
      <carousel-item
        :data="slide"
        :is-active="activeIndex === index"
        :loop="slides.length === 1"
        @video-ended="onVideoEnded(index)"
      />
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import sos from '@signageos/front-applet'
import { log } from './log'
import { isVideoUrl } from './media'

// Keep in sync with the .carousel__item--leaving opacity transition.
const TRANSITION_DURATION = 500

// Video slides advance on their own 'ended' event. The slide timer is only a
// safety net in case a video fails to play, so it gets at least this long.
const MIN_VIDEO_SAFETY_TIMEOUT = 60000

// Screens often boot before the network is ready. Retry a failed load
// in a fixed interval with an upper limit: 15 x 10s = about 2.5 minutes.
// After the last attempt the error stays until Flyo reloads the applet
// (next content change) or the device restarts.
const RETRY_DELAY = 10000
const MAX_RETRIES = 15

// fetch() can hang forever on a broken connection, which would never trigger a retry.
const FETCH_TIMEOUT = 30000

function fetchWithTimeout(url, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
    fetch(url).then(
      (response) => { clearTimeout(timer); resolve(response) },
      (error) => { clearTimeout(timer); reject(error) }
    )
  })
}

export default {
  name: 'App',
  components: {
    carouselItem: defineAsyncComponent(() => import('./components/Carouseltem'))
  },
  data() {
    return {
      api: null,
      activeIndex: 0,
      leavingIndex: null,
      slides: [],
      timeout: 15000,
      slideTimer: null,
      leavingTimer: null,
      retryTimer: null,
      retryCount: 0,
      statusMessage: null,
      isLoading: true
    }
  },
  methods: {

    async loadSlides() {
      let status = null
      let ok = false
      let json

      // Only the request is retried. Errors while rendering are not a
      // connection problem and are handled outside of this try.
      try {
        const response = await fetchWithTimeout(this.api, FETCH_TIMEOUT)
        status = response.status
        ok = response.ok

        // fetch does not throw on an error response of the server (e.g. 502)
        if (!response.ok) {
          throw new Error(`HTTP ${status}`)
        }

        json = await response.json()

        if (!json || !Array.isArray(json.data)) {
          throw new Error('Invalid response: data is missing')
        }
      } catch (error) {
        log({
          type: 'Flyo.LoadFailed',
          url: this.api,
          status: status,
          attempt: this.retryCount + 1,
          message: String(error)
        })

        let message = 'Keine Verbindung zum Server'
        if (status && !ok) {
          message = `Inhalte konnten nicht geladen werden (Fehler ${status})`
        } else if (status) {
          message = 'Ungültige Antwort vom Server'
        }

        if (this.retryCount < MAX_RETRIES) {
          this.retryCount += 1
          this.statusMessage = `${message}, neuer Versuch (${this.retryCount}/${MAX_RETRIES})`
          this.retryTimer = setTimeout(() => this.loadSlides(), RETRY_DELAY)
        } else {
          this.statusMessage = message
        }

        return
      }

      // reset only after a successful load
      this.retryCount = 0
      await this.renderSlides(json)
    },

    async renderSlides(json) {
      const slides = []
      for (const itemData of json.data) {

        // check for empty image
        if (!itemData.image || itemData.image.length == 0) {
          continue
        }

        const slideItem = itemData
        // The offline cache strips non-alphanumeric characters (including the
        // extension's dot) from the uid, so the cached filePath can't tell
        // video from image. Decide it here from the original URL.
        slideItem.isVideo = isVideoUrl(itemData.image)
        slideItem.uid = itemData.image.replace(/[^a-zA-Z0-9]/gi, '')
        slideItem.uri = `${itemData.image}`
        try {

          // signageos approach
          const cacheResponse = await sos.offline.cache.loadOrSaveFile(slideItem.uid, slideItem.uri)
          slideItem.filePath = cacheResponse.filePath

          // local testing approach
          //slideItem.filePath = itemData.uri

          // push slide only on success, a failed file skips this slide instead of stopping the applet
          slides.push(slideItem)
        } catch (error) {
          log({
            type: 'Content.CacheFailed',
            url: slideItem.uri,
            message: String(error)
          })
        }
      }

      if (slides.length === 0) {
        this.statusMessage = 'Keine Inhalte verfügbar'
        return
      }

      this.slides = slides
      this.activeIndex = 0
      this.timeout = json?.config?.timeout || 15000
      this.statusMessage = null
      this.isLoading = false
      this.scheduleNextSlide()
    },

    scheduleNextSlide() {
      clearTimeout(this.slideTimer)

      const currentSlide = this.slides[this.activeIndex]
      const delay = currentSlide && currentSlide.isVideo
        ? Math.max(this.timeout, MIN_VIDEO_SAFETY_TIMEOUT)
        : this.timeout

      this.slideTimer = setTimeout(() => {
        this.progressActiveIndex()
      }, delay)
    },

    progressActiveIndex() {
      const previousIndex = this.activeIndex

      if ((this.activeIndex + 1) >= this.slides.length) {
        this.activeIndex = 0
      } else {
        this.activeIndex += 1
      }

      this.startLeavingTransition(previousIndex)
      this.scheduleNextSlide()
    },

    // The crossfade runs on the outgoing slide, not the incoming one (see CSS).
    // Video slides are never faded, leaving one is a hard cut.
    startLeavingTransition(index) {
      clearTimeout(this.leavingTimer)
      this.leavingIndex = null

      const slide = this.slides[index]
      if (index === this.activeIndex || (slide && slide.isVideo)) {
        return
      }

      this.leavingIndex = index
      this.leavingTimer = setTimeout(() => {
        this.leavingIndex = null
      }, TRANSITION_DURATION)
    },

    onVideoEnded(index) {
      if (index !== this.activeIndex) {
        return
      }

      this.progressActiveIndex()
    }
  },
  beforeMount() {
    this.api = sos?.config?.api || 'https://api.flyo.cloud/integration/signageos/29/WZWj7lyl9dQ80PugsYZNh3-B25Q8glwmenBwrmhvFf9bG-aQYxW18sKsmc2-RtIMvz0SiqyWVHBwiSyKRNjTD5GKbniW'
  },
  mounted() {
    this.loadSlides()
  },
  beforeDestroy() {
    // stop a pending retry and the slide rotation when the applet is torn down
    clearTimeout(this.retryTimer)
    clearTimeout(this.slideTimer)
    clearTimeout(this.leavingTimer)
  }
}
</script>

<style scoped>
.carousel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}

/*
 * Every slide stays fully opaque, slides are switched by z-index stacking.
 * Fading the incoming slide in from opacity 0 would let lower layers show
 * through during the fade, and since video slides stay painted permanently,
 * the paused first frame of a video would flash up on every slide change.
 */
.carousel__item {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 1;
  will-change: opacity;
  z-index: 1;
}

.carousel__item--active {
  z-index: 2;
}

/*
 * The crossfade runs on the outgoing slide instead: it is lifted above the
 * already opaque new slide and faded out, which never lets a lower layer show.
 */
.carousel__item--leaving {
  opacity: 0;
  transition: .5s ease-in-out opacity;
  z-index: 3;
}

/*
 * Embedded webview video decoders don't reliably paint a <video> whose
 * opacity is animated from 0 (they only recover on a full repaint). So video
 * slides are never faded, App.vue skips the leaving transition for them and
 * this is the belt-and-braces for it.
 */
.carousel__item--video {
  opacity: 1;
  transition: none;
}
</style>

<style>
html, body {
  height: 100%;
}
body {
  background-color:white;
  padding: 0;
  margin: 0;
  font-family: 'Krete', sans-serif;
}

.loading {
  height: 100%;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.status {
  margin-top: 40px;
  padding: 0 5vw;
  font-family: sans-serif;
  font-size: 1.5vw;
  color: #666;
  text-align: center;
}

.logo {
  width: 100px;
  height: 100px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.blob {
	animation: pulse 2s infinite;
}

@keyframes pulse {
	0% {
		transform: scale(0.95);
	}

	70% {
		transform: scale(1);
	}

	100% {
		transform: scale(0.95);
	}
}
</style>
