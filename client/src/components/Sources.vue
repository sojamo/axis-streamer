<template>
  <div class="d-flex">
    <b-sidebar
      id="sources-sidebar"
      bg-variant="dark"
      text-variant="light"
      title="Sources"
      no-header-close
    >
      <div class="p-3">
        <h5 class="mb-3">Streams</h5>
        <b-card
          v-for="(stream, i) in streams"
          class="mb-2 p-0"
          :key="`stream-${i}`"
          bg-variant="white"
          text-variant="dark"
          no-body
        >
          <b-card-header header-bg-variant="white">
            <div class="d-flex justify-content-between align-items-center">
              <b>#{{ stream.id }}</b>
              <span>{{ stream.address }}</span>
              <b-button variant="link" @click="() => activateSource(stream)">
                <b-icon :icon="stream.active ? 'pause' : 'play'" />
              </b-button>
            </div>
          </b-card-header>
        </b-card>

        <hr class="border-primary w-50 my-5" />

        <h5>Files</h5>
        <b-form-file v-model="file" size="sm" class="mb-2" />
        <b-button :disabled="!file" @click="upload">Upload</b-button>
      </div>
      <div class="tab slide d-flex align-items-center" v-b-toggle.sources-sidebar>
        <div class="tab-text">Sources</div>
      </div>
    </b-sidebar>
    <div class="tab d-flex align-items-center" v-b-toggle.sources-sidebar>
      <div class="tab-text">Sources</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, Ref, ref } from '@vue/composition-api';
import axios from 'axios';
import msgpack from '@ygoe/msgpack';

const BASE_URL = process.env.VUE_APP_BASE_URL;

export default defineComponent({
  props: {
    streams: {
      type: Array,
      required: true,
    },
  },

  setup(props) {
    function activateSource(stream) {
      stream.active = !stream.active;
      this.$ws.send(
        msgpack.serialize({
          address: 'source/activation',
          args: { sourceId: stream.id, state: stream.active },
        }),
      );
    }

    const streamsRes = {
      activateSource,
    };

    // Files
    ///////////////////////////////////////////////////////////////////////////
    const file: Ref<File | null> = ref(null);

    function upload() {
      console.log(file.value);
      if (file.value !== undefined) {
        let formData = new FormData();
        formData.append('bvh', file.value);

        console.log(formData);

        axios
          .post(`${BASE_URL}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          .then(res => console.log(res));
      }
    }

    const filesRes = {
      file,
      upload,
    };

    return {
      ...streamsRes,
      ...filesRes,
    };
  },
});
</script>

<style lang="scss" scoped>
@import '../assets/scss/custom.scss';

#sources-sidebar {
  display: block !important;
}

.tab {
  width: 30px;
  height: 100px;
  background-color: $primary;
  border-color: $black !important;
  color: $white !important;
  box-shadow: none !important;
  outline: 0px !important;

  .tab-text {
    transform-origin: center;
    transform: rotate(-90deg) translateY(-10px);
  }
}

.slide {
  position: absolute;
  top: 100px;
  right: -30px;
}
</style>
