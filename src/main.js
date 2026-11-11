import Vue from 'vue'
import App from './App.vue'
import sos from '@signageos/front-applet'
import { log } from './log'

// Unexpected errors in components or promises are logged instead of failing silently.
Vue.config.errorHandler = (error, vm, info) => {
  console.error(error)
  log({ type: 'Applet.Error', info: info, message: String(error) })
}

window.addEventListener('unhandledrejection', (event) => {
  log({ type: 'Applet.UnhandledRejection', message: String(event.reason) })
})

sos.onReady().then(() => {
  new Vue({
    render: h => h(App),
  }).$mount('#app')
})
