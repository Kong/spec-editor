<template>
  <KButton
    appearance="secondary"
    icon
    size="small"
    @click="isVisible = true"
  >
    <CogIcon
      decorative
      :size="KUI_ICON_SIZE_40"
    />
  </KButton>

  <Teleport to="body">
    <KModal
      action-button-appearance="secondary"
      action-button-text="Close"
      hide-cancel-button
      max-width="640px"
      title="API documentation options"
      :visible="isVisible"
      @cancel="isVisible = false"
      @proceed="isVisible = false"
    >
      <p>
        Configure options for how your API spec appears in the renderer.
      </p>
      <div class="settings-modal-list">
        <KCard
          v-for="setting in API_DOC_OPTIONS"
          :key="setting.prop"
          class="settings-modal-card"
        >
          <template #title>
            <h3>{{ setting.label }}</h3>
            <p>{{ setting.description }}</p>
          </template>
          <template #actions>
            <KInputSwitch
              :id="setting.prop"
              :model-value="setting.inverted ? !options[setting.prop] : options[setting.prop]"
              @update:model-value="options[setting.prop] = setting.inverted ? !$event : $event"
            />
          </template>
        </KCard>
      </div>
    </KModal>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CogIcon } from '@kong/icons'
import useApiDocOptions from '@/composables/useApiDocOptions'
import { KCard, KInputSwitch } from '@kong/kongponents'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { API_DOC_OPTIONS } from '@/constants'

const { options } = useApiDocOptions()

const isVisible = ref(false)
</script>

<style lang="scss" scoped>
.settings-modal-list {
  display: flex;
  flex-direction: column;
  gap: $kui-space-70;
  margin-top: $kui-space-70;

  :deep(.k-card) {
    padding: $kui-space-20 $kui-space-70 $kui-space-70 $kui-space-70;

    .card-header {
      align-items: center;
    }
  }

  .settings-modal-card {
    .card-title {
      h3 {
        font-size: $kui-font-size-40;
        font-weight: $kui-font-weight-bold;
        line-height: $kui-line-height-30;
      }

      p {
        color: $kui-color-text-neutral;
        font-size: $kui-font-size-30;
        font-weight: $kui-font-weight-regular;
        line-height: $kui-line-height-30;
        margin-top: $kui-space-20;
      }
    }
  }
}
</style>
