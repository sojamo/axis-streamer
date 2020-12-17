import Vue from 'vue';
import router from './router';
import App from './App.vue';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import VueCompositionAPI from '@vue/composition-api';

Vue.config.productionTip = false;

Vue.use(VueCompositionAPI);

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
