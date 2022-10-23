const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: './',
  /*
  chainWebpack: config => {
    config
      .plugin('html')
      .tap(options => {
        options[0].scriptLoading = null
        return options
      })
  }
  */
})
