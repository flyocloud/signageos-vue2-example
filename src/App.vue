<template>
  <div class="loading" v-if="isLoading">
    <div class="logo">
      <img width="200" class="blob" src="flyo.svg" />
    </div>
  </div>
  <div class="carousel" v-else>
    <div
      v-for="(slide, index) in slides"
      :key="slide.entity_id"
      class="carousel__item"
      :class="{ 'carousel__item--active': activeIndex === index }"
    >
      <carousel-item :data="slide" />
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import sos from '@signageos/front-applet'

export default {
  name: 'App',
  components: {
    carouselItem: defineAsyncComponent(() => import('./components/Carouseltem'))
  },
  data() {
    return {
      api: null,
      activeIndex: 0,
      slides: [],
      intervalInstance: null,
      isLoading: true
    }
  },
  methods: {

    loadSlides: async function() {
      var response = await fetch(this.api)
      var responseJson = await response.json()

      for (var itemData of responseJson.data) {
        itemData.uid = `${itemData.uid}-${itemData.entity_id}`
        itemData.uri = `${itemData.image}`
        try {
          //itemData.filePath = (await sos.offline.cache.loadOrSaveFile(itemData.uid, itemData.uri)).filePath
          itemData.filePath = itemData.uri
        } catch (e) {
          console.log('error', e)
          itemData.filePath = itemData.uri
        }
      }

      this.slides = responseJson.data
      const timeout = responseJson?.config?.timeout || 15000
      this.isLoading = false
      this.intervalInstance = setInterval(() => {
        this.progressActiveIndex()
      }, timeout)
    },

    progressActiveIndex: async function () {
      if ((this.activeIndex + 1) == this.slides.length) {
        this.activeIndex = 0
      } else {
        this.activeIndex += 1
      }
    }
  },
  beforeMount() {
    this.api = sos?.config?.api || 'https://api.flyo.cloud/integration/signageos/29/WZWj7lyl9dQ80PugsYZNh3-B25Q8glwmenBwrmhvFf9bG-aQYxW18sKsmc2-RtIMvz0SiqyWVHBwiSyKRNjTD5GKbniW'
  },
  mounted() {
    this.loadSlides()
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

.carousel__item {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: .5s ease-in-out opacity;
}

.carousel__item--active {
  opacity: 1;
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
  align-items: center;
  justify-content: center;
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