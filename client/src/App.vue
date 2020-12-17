<template>
  <div id="app">
    <settings />
    <streams />

    <b-nav vertical pills>
      <b-nav-item v-b-toggle.settings-sidebar>View</b-nav-item>
      <b-nav-item v-b-toggle.streams-sidebar>Streams</b-nav-item>
    </b-nav>

    <stage />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import Settings from './components/Settings.vue';
import Stage from './components/Stage.vue';
import Streams from './components/Streams.vue';

export default defineComponent({
  components: {
    Settings,
    Stage,
    Streams,
  },
});
</script>

<style lang="scss">
@import 'assets/scss/custom.scss';

#app {
  display: flex;
  height: 100vh;
}

.nav {
  border-right: 1px solid $gray-700;
}
</style>
