<template>
  <BaseModal class="renderer-settings-modal">
    <template #trigger="{ toggleModal }">
      <KButton
        appearance="secondary"
        icon
        size="small"
        @click="toggleModal()"
      >
        <CogIcon
          decorative
          :size="KUI_ICON_SIZE_40"
        />
      </KButton>
    </template>

    <template #default="{ toggleModal }">
      <div class="renderer-settings-modal-container">
        <div class="settings-modal-header">
          <h2>API documentation options</h2>

          <button
            class="close-modal-button"
            @click="toggleModal()"
          >
            <CloseIcon
              decorative
              :size="KUI_ICON_SIZE_40"
            />
          </button>
        </div>
        <div class="settings-modal-content">
          <p>Configure options for how your API spec appears in the renderer.</p>
          <div class="settings-modal-toggle-list">
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
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { CogIcon, CloseIcon } from '@kong/icons'
import { KCard, KInputSwitch } from '@kong/kongponents'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import BaseModal from './common/BaseModal.vue'
import { API_DOC_OPTIONS } from '@/constants'
import useApiDocOptions from '@/composables/useApiDocOptions'

const { options } = useApiDocOptions()
</script>

<style lang="scss" scoped>
.renderer-settings-modal-container {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  color: $kui-color-text;
  width: 640px;

  * {
    box-sizing: border-box;
    margin: 0;
  }

  .settings-modal-header {
    align-items: center;
    border-bottom: $kui-border-width-10 solid $kui-color-border;
    display: flex;
    justify-content: space-between;
    padding: $kui-space-70 $kui-space-80;

    h2 {
      font-size: $kui-font-size-60;
      font-weight: $kui-font-weight-bold;
      line-height: $kui-line-height-50;
    }

    .close-modal-button {
      @include default-button-reset;
      border-radius: $kui-border-radius-20;
      color: $kui-color-text-neutral;
      cursor: pointer;
      padding: $kui-space-20 $kui-space-40;
      transition: color 0.2s ease-in-out,
        color 0.2s ease-in-out,
        border-color 0.2s ease-in-out;

      &:hover:not(:disabled):not(:focus):not(:active) {
        background-color: $kui-color-background-neutral-weakest;
        color: $kui-color-text-neutral-stronger;
      }
    }
  }

  .settings-modal-content {
    background-color: $kui-color-background-neutral-weakest;
    padding: $kui-space-80;

    > p {
      font-size: $kui-font-size-30;
      font-weight: $kui-font-weight-regular;
      line-height: $kui-line-height-30;
      margin-bottom: $kui-space-70;
    }
  }

  .settings-modal-toggle-list {
    display: flex;
    flex-direction: column;
    gap: $kui-space-40;

    .settings-modal-card {
      :deep(.card-header) {
        align-items: center
      }

      .card-title {
        h3 {
          font-size: $kui-font-size-30;
          font-weight: $kui-font-weight-semibold;
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
}
</style>
