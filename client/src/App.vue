<template>
  <div id="app">
    <b-navbar variant="dark">
      <b-navbar-nav>
        <!-- <b-nav-item v-b-toggle.settings-sidebar>Settings</b-nav-item> -->
        <b-nav-item v-b-toggle.sources-sidebar>Sources</b-nav-item>
      </b-navbar-nav>
    </b-navbar>

    <!-- <settings /> -->
    <sources :streams.sync="streams" />
    <!-- <stage id="stage" :body.sync="body" /> -->

    <!-- Stage -->
    <div class="stage-container d-flex justify-content-center align-items-center h-100">
      <div id="sketch" ref="sketchTemplate" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, Ref } from '@vue/composition-api';
import Settings from './components/Settings.vue';
import Stage from './components/Stage.vue';
import Sources from './components/Sources.vue';
import msgpack from '@ygoe/msgpack';
import useStage from './hooks/useStage';

export default defineComponent({
  components: {
    Settings,
    Stage,
    Sources,
  },

  setup(props) {
    const streams = ref([]);

    // stage stuff
    const body: Ref<Object> = ref({});
    const { target } = useStage(body.value);

    onMounted(() => {
      const port = 5080;
      const isSecure = false;

      /** extract server url */
      const url =
        window.location.hostname === 'localhost'
          ? 'ws://localhost:' + port
          : isSecure
          ? 'wss://' + window.location.hostname + ':' + port
          : 'ws://' + window.location.hostname + ':' + port;

      /** start websocket and connect to url */
      const ws = new WebSocket(url);

      ws.onopen = function() {
        console.log(`opening websocket to ${url}`);

        /** we are expecting arraybuffers, data wrapped into bytes */
        ws.binaryType = 'arraybuffer';
        /**
         * we are using msgpack to serialize
         * and deserialize data and send as bytes, string
         * formated data is ignored on the server.
         */
        ws.send(msgpack.serialize({ address: 'subscribe', args: { id: 'axis-web' } })); /** OK */
        // ws.send({ register: 'abc', id: 123 }); /** ignored */
      };

      /** incoming messages are received here, we expect
       * bytes and not strings. data is deserialised with
       * the msgpack library by https://github.com/ygoe/msgpack.js
       * and must be included locally (on the server).
       */
      ws.onmessage = function(ev) {
        // console.log(ev);

        const packet = msgpack.deserialize(ev.data);
        const { address, args } = packet;
        switch (address) {
          case 'pn':
            args.forEach((el: any) => {
              target(el);
            });
            break;

          case 'settings':
            console.log(args);
            // document.getElementById('settings-label').innerHTML = args.label;
            // document.getElementById('settings-json').innerHTML = JSON.stringify(args.broadcast, null, 2);
            break;

          case 'sources':
            console.log(args);
            let i = 0;
            streams.value = args.map(arg => {
              return {
                id: i++,
                address: 'x.x.x.x',
              };
            });
            break;
        }
      };
    });

    return {
      body,
      streams,
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
