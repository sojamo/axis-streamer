<template>
  <b-sidebar id="sources-sidebar" bg-variant="dark" text-variant="light" title="Sources">
    <div class="p-3">
      <h5 class="mb-3">Streams</h5>
      <b-card
        v-for="(stream, i) in streams"
        class="mb-2 p-0"
        :key="`stream-${i}`"
        bg-variant="white"
        text-variant="dark"
      >
        <div class="d-flex justify-content-between align-items-center">
          <b>#{{ stream.id }}</b>
          <span>{{ stream.address }}</span>
          <b-button class="text-danger" size="sm" variant="link">
            <b-icon icon="trash" />
          </b-button>
        </div>
      </b-card>

      <validation-observer v-slot="{ handleSubmit }">
        <b-form class="mt-4" @submit.prevent="handleSubmit(addStream)">
          <validation-provider name="IP address" rules="required|ip" v-slot="{ errors }">
            <b-input-group prepend="IP">
              <b-form-input v-model="ip" />
              <b-input-group-append>
                <b-button type="submit" :disabled="!ip">Add</b-button>
              </b-input-group-append>
            </b-input-group>
            <small class="text-danger">{{ errors[0] }}</small>
          </validation-provider>
        </b-form>
      </validation-observer>

      <hr class="border-primary w-50 my-5" />

      <h5>Files</h5>
    </div>
  </b-sidebar>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from '@vue/composition-api';
import axios from 'axios';

export default defineComponent({
  setup(props, { root }) {
    // Get streams
    const streams = ref([]);

    function getStreams() {
      return axios.get('http://localhost:5080/streams').then(res => {
        streams.value = res.data;
      });
    }

    onMounted(getStreams);

    // New stream
    const ip = ref('');

    function addStream() {
      return axios
        .post(`http://localhost:5080/stream`, { address: ip.value })
        .then(_ => getStreams())
        .catch(err => {
          root.$bvToast.toast(err.message, { title: 'Oops', variant: 'danger' });
        });
    }

    return {
      streams,
      ip,
      addStream,
    };
  },
});
</script>
