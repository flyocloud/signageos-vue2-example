<template>
  <div class="carousel-item">
    <img class="carousel-item__image" :src="data.filePath || data.image" />
  </div>
</template>

<script>
export default {
  name: 'CarouselItem',
  props: {
    data: {
      type: Object
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
</style>