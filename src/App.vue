<template>
  <div class="carousel">
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
      timeout: 15000,
      intervalInstance: null
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
          itemData.filePath = (await sos.offline.cache.loadOrSaveFile(itemData.uid, itemData.uri)).filePath
          //itemData.filePath = itemData.uri
        } catch (e) {
          console.log('error', e)
          itemData.filePath = itemData.uri
        }
      }

      this.slides = responseJson.data
      this.timeout = responseJson?.config?.timeout || 15000
    },

    progressActiveIndex: async function () {
      if ((this.activeIndex + 1) == this.slides.length) {
        this.activeIndex = 0
      } else {
        this.activeIndex += 1
      }
    }

  },
  watch: {
    timeout: function(newVal) {
      if (this.intervalInstance) {
        clearInterval(this.intervalInstance)
      }

      this.intervalInstance = setInterval(() => {
        this.progressActiveIndex()
      }, newVal)
    }
  },
  beforeMount() {
    this.api = sos?.config?.api || 'test.api'
  },
  mounted() {
    this.loadSlides()
    this.intervalInstance = setInterval(() => {
      this.progressActiveIndex()
    }, this.timeout)
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
body {
  background-color:white;
  padding: 0;
  margin: 0;
  font-family: 'Krete', sans-serif;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}
</style>