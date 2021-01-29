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
      <div class="p-3">{{ settings }}</div>
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
import { defineComponent } from '@vue/composition-api';
export default defineComponent({
  props: {
    settings: {
      type: String,
      required: true,
      default: '',
    },
  },

  setup(props) {},
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
</style>
