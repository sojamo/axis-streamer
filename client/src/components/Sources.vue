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
        no-body
      >
        <b-card-header header-bg-variant="white">
          <div class="d-flex justify-content-between align-items-center">
            <b>#{{ stream.id }}</b>
            <span>{{ stream.address }}</span>
            <b-button
              class="text-danger"
              size="sm"
              variant="link"
              @click="() => removeStream(stream.id)"
            >
              <b-icon icon="trash" />
            </b-button>
          </div>
        </b-card-header>
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
      <b-form-file v-model="file" size="sm" class="mb-2" />
      <b-button :disabled="!file" @click="upload">Upload</b-button>
    </div>
  </b-sidebar>
</template>

<script lang="ts">
import { defineComponent, onMounted, Ref, ref } from '@vue/composition-api';
import axios from 'axios';

const BASE_URL = process.env.VUE_APP_BASE_URL;

export default defineComponent({
  setup(props, { emit, root }) {
    // Streams
    ///////////////////////////////////////////////////////////////////////////
    const streams = ref([]);

    function getStreams() {
      return axios.get(`${BASE_URL}/streams`).then((res) => {
        streams.value = res.data;
      });
    }

    onMounted(getStreams);

    const ip = ref('');

    function addStream() {
      return axios
        .post(`${BASE_URL}/stream`, { address: ip.value })
        .then((_) => getStreams())
        .catch((err) => {
          root.$bvToast.toast(err.message, { title: 'Oops', variant: 'danger' });
        });
    }

    function removeStream(id: number) {
      return axios
        .delete(`${BASE_URL}/stream/${id}`)
        .then((_) => getStreams())
        .then((_) => emit('stream-removed', id))
        .catch((err) => console.error(err));
    }

    const streamsRes = {
      streams,
      ip,
      addStream,
      removeStream,
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
          .then((res) => console.log(res));
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
