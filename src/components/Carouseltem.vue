<template>
  <div class="carousel-item">
    <img class="carousel-item__image" :src="data.filePath || data.image" />
    <div class="carousel-item__overlay">
      <div class="carousel-text-overlay">
        <div class="carousel-text-overlay__content">
          <div class="carousel-text-overlay__teaser">
            {{ data.teaser }}
          </div>
          <div class="carousel-text-overlay__title">
            {{ truncatedTitle }}
          </div>
        </div>
        <div class="carousel-text-overlay__qr">
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
export default {
  name: 'CarouselItem',
  props: {
    data: {
      type: Object
    }
  },
  computed: {
    truncatedTitle: function() {
        if (this.data.title.length > 40) {
            return this.data.title.slice(0, 37) + '...'
        }

        return this.data.title
    },

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