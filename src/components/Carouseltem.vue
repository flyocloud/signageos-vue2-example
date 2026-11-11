<template>
  <div class="carousel-item">
    <video
      v-if="isVideo"
      ref="video"
      class="carousel-item__image"
      :src="videoSrc"
      :loop="loop"
      muted
      playsinline
      preload="auto"
      @ended="onVideoEnded('ended')"
      @error="onVideoEnded('error')"
    />
    <img v-else class="carousel-item__image" :src="data.filePath || data.image" />
    <div class="carousel-item__overlay">
      <div class="carousel-text-overlay">
        <div class="carousel-text-overlay__content">
          <div v-if="data.teaser && data.teaser.length > 0">
            <div class="carousel-text-overlay__teaser">
              {{ data.teaser }}
            </div>
          </div>
          <div v-if="data.title && data.title.length > 0">
            <div 
              class="carousel-text-overlay__title"
              :class="titleSizeClass"  
            >{{ data.title }}</div>
          </div>
        </div>
        <div class="carousel-text-overlay__qr" v-if="data.qrcode && data.qrcode.length > 0">
            <img
                class="carousel-text-overlay__qr-image"
                v-if="data.qrcode"
                :src="data.qrcode"
            />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { log } from '../log'

export default {
  name: 'CarouselItem',
  props: {
    data: {
      type: Object
    },
    isActive: {
      type: Boolean,
      default: false
    },
    // Only one slide in the playlist: the video loops instead of ending,
    // otherwise it would stop on its last frame (activeIndex never changes).
    loop: {
      type: Boolean,
      default: false
    }
  },
  emits: ['video-ended'],
  data() {
    return {
      videoSrc: null,
      videoFailed: false,
      canPlayHandler: null
    }
  },
  watch: {
    isActive(isActive) {
      if (!this.isVideo) {
        return
      }

      if (isActive) {
        this.playVideo()
      } else {
        this.resetVideo()
      }
    }
  },
  mounted() {
    // NOTE: don't force the video onto its own GPU layer (e.g. translateZ(0)).
    // On Tizen that promotes the <video> to a hardware overlay plane rendered
    // behind the page, so the first frame flashes and then vanishes.
    if (this.isVideo) {
      this.loadVideoBlob()
    }
  },
  beforeDestroy() {
    this.removeCanPlayHandler()
    if (this.videoSrc) {
      URL.revokeObjectURL(this.videoSrc)
    }
  },
  methods: {
    // The offline cache serves files over a service worker route
    // (/indexed_db/...) that answers Range requests with a full 200 instead
    // of a 206. Safari-based webviews corrupt their buffered ranges against
    // that and the video freezes a few frames in, without any error event.
    // Fetching the file once and playing it from a blob: URL avoids the
    // service worker path and its broken Range handling entirely.
    async loadVideoBlob() {
      const url = this.data.filePath || this.data.image
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const blob = await response.blob()
        this.videoSrc = URL.createObjectURL(blob)
        await this.$nextTick()
        if (this.isActive) {
          this.playVideo()
        }
      } catch (error) {
        this.videoFailed = true
        log({
          type: 'Video.LoadFailed',
          url: this.data.uri,
          message: String(error)
        })
        this.onVideoEnded('load-failed')
      }
    },

    playVideo() {
      // a video that could not be loaded is skipped right away instead of
      // showing a black slide until the safety timer kicks in
      if (this.videoFailed) {
        this.onVideoEnded('load-failed')
        return
      }

      const video = this.$refs.video
      if (!video) {
        return
      }

      // Calling play() before the video has buffered enough can silently fail
      // on embedded webviews (AbortError race), so wait for 'canplay' first.
      if (video.readyState < 3) {
        this.removeCanPlayHandler()
        this.canPlayHandler = () => {
          this.removeCanPlayHandler()
          if (this.isActive) {
            this.playVideo()
          }
        }
        video.addEventListener('canplay', this.canPlayHandler)
        return
      }

      video.currentTime = 0
      const playResult = video.play()
      if (playResult && typeof playResult.then === 'function') {
        playResult.catch((error) => {
          this.onVideoEnded('play-rejected: ' + String(error))
        })
      }
    },

    resetVideo() {
      this.removeCanPlayHandler()
      const video = this.$refs.video
      if (!video) {
        return
      }

      video.pause()
      video.currentTime = 0
    },

    removeCanPlayHandler() {
      const video = this.$refs.video
      if (video && this.canPlayHandler) {
        video.removeEventListener('canplay', this.canPlayHandler)
      }
      this.canPlayHandler = null
    },

    onVideoEnded(reason) {
      // Only log when something went wrong: a regular end happens on every
      // playback and would flood the log stream. A failed load is already
      // logged once as Video.LoadFailed and is not repeated on every skip.
      if (reason !== 'ended' && reason !== 'load-failed') {
        const video = this.$refs.video
        log({
          type: 'Video.Ended',
          url: this.data.uri,
          reason: reason,
          isActive: this.isActive,
          currentTime: video ? video.currentTime : null,
          errorCode: video && video.error ? video.error.code : null
        })
      }

      if (!this.isActive) {
        return
      }

      this.$emit('video-ended')
    }
  },
  computed: {
    isVideo() {
      return Boolean(this.data.isVideo)
    },
    titleSizeClass: function() {
        if (this.data.title.length > 35) {
            return 'carousel-text-overlay__title--50'
        } else if (this.data.title.length > 25) {
            return 'carousel-text-overlay__title--75'
        } else {
            return ''
        }
    }
  }
}
</script>

<style scoped>
.carousel-item {
  width: 100%;
  height: 100%;
  position: relative;
}

.carousel-item__image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 10;
}

.carousel-item__overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 20;
}

.carousel-text-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.carousel-text-overlay__content {
    position: absolute;
    bottom: 9.5vw;
    left: 3vw;
}

.carousel-text-overlay__teaser {
    display: inline-block;
    font-size: 3.5vw;
    line-height: 1.25em;
    text-transform: uppercase;
    background-color: #000;
    color: #fff;
    font-weight: 500;
    padding: .5vw .7vw;
}

.carousel-text-overlay__title {
    display: inline-block;
    font-size: 4.5vw;
    line-height: 1.25em;
    text-transform: uppercase;
    background-color: #fff;
    color: #000;
    font-weight: 700;
    padding: .5vw .7vw;
}

.carousel-text-overlay__title--75 {
    font-size: 3.375vw;
}

.carousel-text-overlay__title--50 {
    font-size: 2.25vw;
}

.carousel-text-overlay__qr {
    position: absolute;
    right: 3vw;
    bottom: 1.2vw;
    width: 7vw;
}

.carousel-text-overlay__qr-image {
    width: 100%;
    height: auto;
}

</style>
