<template>
  <div id="app">
    <settings />
    <sources />

    <b-nav vertical pills>
      <b-nav-item v-b-toggle.settings-sidebar>Settings</b-nav-item>
      <b-nav-item v-b-toggle.sources-sidebar>Sources</b-nav-item>
    </b-nav>

    <stage />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import Settings from './components/Settings.vue';
import Stage from './components/Stage.vue';
import Sources from './components/Sources.vue';

export default defineComponent({
  components: {
    Settings,
    Stage,
    Sources,
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
