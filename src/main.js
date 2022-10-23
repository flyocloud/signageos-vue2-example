import Vue from 'vue'
import App from './App.vue'
//import sos from '@signageos/front-applet'

//sos.onReady().then(() => {
  new Vue({
    render: h => h(App),
  }).$mount('#app')
//})
