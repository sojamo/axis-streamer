import Vue from 'vue';
import router from './router';
import App from './App.vue';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import VueCompositionAPI from '@vue/composition-api';
import { ValidationObserver, ValidationProvider, extend } from 'vee-validate';
import * as rules from 'vee-validate/dist/rules';
import validator from 'validator';

Vue.config.productionTip = false;

Vue.use(VueCompositionAPI);
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

Vue.component('ValidationObserver', ValidationObserver);
Vue.component('ValidationProvider', ValidationProvider);

// Setup websocket
const url = process.env.VUE_APP_WS_URL;
// window.location.hostname === 'localhost'
//   ? 'ws://localhost:' + port
//   : isSecure
//   ? 'wss://' + window.location.hostname + ':' + port
//   : 'ws://' + window.location.hostname + ':' + port;

/** start websocket and connect to url */
Vue.prototype.$ws = new WebSocket(url);

// Add standard rules
for (let [rule, validation] of Object.entries(rules)) {
  extend(rule, { ...validation });
}

// Add custom rules
extend('ip', {
  validate: value => validator.isIP(value),
  message: '{_field_} is not a valid IP',
});

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
