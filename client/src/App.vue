<template>
  <div id="app">
    <b-navbar variant="dark">
      <b-navbar-nav>
        <!-- <b-nav-item v-b-toggle.settings-sidebar>Settings</b-nav-item> -->
        <b-nav-item v-b-toggle.sources-sidebar>Sources</b-nav-item>
      </b-navbar-nav>
    </b-navbar>

    <!-- <settings /> -->
    <sources @stream-removed="handleStreamRemoved" />
    <stage id="stage" :body.sync="body" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref } from '@vue/composition-api';
import Settings from './components/Settings.vue';
import Stage from './components/Stage.vue';
import Sources from './components/Sources.vue';

export default defineComponent({
  components: {
    Settings,
    Stage,
    Sources,
  },

  setup(props) {
    const body: Ref<Object> = ref({});

    function handleStreamRemoved(id: number) {
      delete body.value[id];
    }

    return {
      body,
      handleStreamRemoved,
    };
  },
});
</script>

<style lang="scss">
@import 'assets/scss/custom.scss';

#app {
}

#stage {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: -1;
}
</style>
