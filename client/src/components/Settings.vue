<template>
  <div>
    <b-sidebar
      id="settings-sidebar"
      bg-variant="dark"
      text-variant="light"
      title="Settings"
      no-header-close
      @mousewheel.prevent=""
    >
     <!-- OSC -->
      <div class="p-3">
        <b-button v-b-toggle.collapse-1 variant="outline-primary">OSC</b-button>
        <b-collapse id="collapse-1" class="mt-2">
          <b-card border-variant="secondary">
            <p class="card-text"><b>Port:</b> {{ oscPort }}</p>
            <p class="card-text"><b>Address:</b> {{ oscAddress }}</p>
            <template #footer>
              <small class="text-muted">{{ oscDescription }}</small>
            </template>
          </b-card>
        </b-collapse>
      </div>

      <!-- Freq -->
      <div class="p-3">
        <b-button v-b-toggle.collapse-2 variant="outline-primary">Updates frequency</b-button>
        <b-collapse id="collapse-2" class="mt-2">
          <b-card border-variant="secondary">
            <p class="card-text"><b>Broadcast:</b> {{ freqBroadcast }}</p>
            <p class="card-text"><b>Update:</b> {{ freqUpdate }} ms</p>
            <template #footer>
              <small class="text-muted">{{ freqDescription }}</small>
            </template>
          </b-card>
        </b-collapse>
    </div>

      <!-- External -->
      <div class="p-3">
        <b-button v-b-toggle.collapse-3 variant="outline-primary">External folder</b-button>
        <b-collapse id="collapse-3" class="mt-2">
          <b-card border-variant="secondary">
            <p class="card-text"><b>Dir:</b> {{ externalDir }}</p>
            <template #footer>
              <small class="text-muted">{{ externalDescription }}</small>
            </template>
          </b-card>
        </b-collapse>
    </div>
      <div class="tab slide d-flex align-items-center" v-b-toggle.settings-sidebar>
      <div class="tab-text">Settings</div>      
  </div>

    </b-sidebar>
    <div class="tab d-flex align-items-center" v-b-toggle.settings-sidebar>
      <div class="tab-text">Settings</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, watchEffect, computed } from '@vue/composition-api';
export default defineComponent({
  props: {
    settingsProperty: {
      type: Object,
      required: false,

    },
  },

  setup(props) {
    //OSC
    const oscPort = computed(()=>{
      return props.settingsProperty ? props.settingsProperty.general.osc.port : '';
    });
    const oscAddress = computed(()=>{
      return props.settingsProperty ? props.settingsProperty.general.osc.address : '';
    });
    const oscDescription = computed(()=>{
      return props.settingsProperty ? props.settingsProperty.general.osc.description : '';
    });

    //Freq
    const freqBroadcast = computed(()=>{
      return props.settingsProperty ? props.settingsProperty.general.freq.broadcast : '';
    });
    const freqUpdate = computed(()=>{
      return props.settingsProperty ? props.settingsProperty.general.freq.update : '';
    });
    const freqDescription = computed(()=>{
      return props.settingsProperty ? props.settingsProperty.general.freq.description : '';
    });

    //External
    const externalDir = computed(()=>{
      return props.settingsProperty ? props.settingsProperty.general.external.dir : '';
    });
    const externalDescription = computed(()=>{
      return props.settingsProperty ? props.settingsProperty.general.external.description : '';
    });

    return {
      oscPort,
      oscAddress,
      oscDescription,
      freqBroadcast,
      freqUpdate,
      freqDescription,
      externalDir,
      externalDescription
    }
  },
});
</script>

<style lang="scss" scoped>
@import '../assets/scss/custom.scss';

.tab {
  width: 30px;
  height: 100px;
  background-color: $primary;
  border-color: $black !important;
  color: $white !important;
  box-shadow: none !important;
  outline: 0px !important;

  &:active {
    border-color: $black !important;
  }

  .tab-text {
    transform-origin: center;
    transform: rotate(-90deg) translateY(-10px);
  }
}

.slide {
  position: absolute;
  top: 0px;
  right: -30px;
}

// .sidebar-settings {
//   overflow-y: scroll;
// }
</style>
