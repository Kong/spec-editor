<template>
  <div
    ref="dropzone"
    class="spec-renderer-playground"
  >
    <header class="editor-header">
      <div class="header-title">
        <KongLogo class="kong-logo" />
        <p>
          API documentation editor
        </p>
      </div>
      <div class="header-actions">
        <KExternalLink
          class="create-developer-portal"
          data-testid="create-developer-portal"
          hide-icon
          href="https://konghq.com/products/kong-konnect/features/developer-portal"
        >
          Create developer portal
        </KExternalLink>
        <KTooltip text="View on GitHub">
          <KExternalLink
            class="github-link"
            hide-icon
            href="https://github.com/Kong/spec-renderer"
          >
            <img
              alt="GitHub logo"
              src="/github-logo.svg"
            >
          </KExternalLink>
        </KTooltip>
      </div>
    </header>
    <Splitpanes class="spec-container default-theme">
      <Pane
        v-if="showLeftPane"
        class="pane-left"
        :max-size="isMobile ? 100 : 70"
        :min-size="30"
      >
        <SpecToolbar class="editor-toolbar">
          <template #left>
            <h2 class="toolbar-title">
              API specification
            </h2>
          </template>
          <template #right>
            <KDropdown
              :kpop-attributes="{
                placement: 'bottom-end',
              }"
              width="267px"
            >
              <template #default>
                <KButton appearance="tertiary">
                  Load an API
                  <ChevronDownIcon decorative />
                </KButton>
              </template>
              <template #items>
                <KDropdownItem @click="dropzoneClick">
                  <UploadIcon
                    :color="KUI_COLOR_TEXT_NEUTRAL"
                    decorative
                  />
                  Upload API specification
                </KDropdownItem>
                <template v-for="items of files">
                  <KDropdownItem
                    v-for="item of items"
                    :key="item.label"
                    :disabled="!item.file"
                    :has-divider="!item.file"
                    @click="!item.file ? undefined : loadSampleSpec(item.label)"
                  >
                    {{ item.label }}
                  </KDropdownItem>
                </template>
              </template>
            </KDropdown>
            <KButton
              appearance="tertiary"
              :disabled="isCleared"
              @click="clearSpec"
            >
              Clear
            </KButton>
            <KTooltip
              placement="bottom-end"
              :text="isMobile ? 'Hide editor' : 'Collapse'"
            >
              <KButton
                appearance="secondary"
                :aria-label="isMobile ? 'Hide editor' : 'Collapse'"
                icon
                size="small"
                @click="toggleLeftPane"
              >
                <ChevronDoubleLeftIcon decorative />
              </KButton>
            </KTooltip>
            <input
              ref="fileInput"
              accept=".json, .yaml, .yml"
              class="file-input"
              type="file"
              @change="fileUploaded"
            >
          </template>
        </SpecToolbar>
        <SpecEditor
          ref="editor"
          v-model="code"
        />
      </Pane>
      <Pane
        v-if="!isMobile || !showLeftPane"
        class="spec-renderer-pane"
        :class="{ 'collapsed': !showLeftPane }"
      >
        <SpecToolbar>
          <template #left>
            <KTooltip
              v-if="!showLeftPane"
              placement="bottom-start"
              :text="isMobile ? 'Show editor' : 'Expand'"
            >
              <KButton
                appearance="secondary"
                :aria-label="isMobile ? 'Show editor' : 'Expand'"
                icon
                size="small"
                @click="toggleLeftPane"
              >
                <ChevronDoubleRightIcon decorative />
              </KButton>
            </KTooltip>
            <h2 class="toolbar-title">
              API documentation preview
            </h2>
          </template>
          <template #right>
            <SettingsModal />
          </template>
        </SpecToolbar>
        <KSkeleton
          v-if="isLoading"
          hide-progress
          type="fullscreen-kong"
        />
        <SpecRenderer
          v-show="!isCleared && !isLoading"
          class="spec-renderer"
          :control-address-bar="true"
          document-scrolling-container=".spec-renderer-pane"
          :spec="specText"
          v-bind="options"
        />
        <KEmptyState
          v-show="isCleared"
          class="editor-container-state"
          message="	Paste or upload an API specification to generate documentation."
          title="API documentation"
        >
          <template #icon>
            <VisibilityIcon decorative />
          </template>
        </KEmptyState>
      </Pane>
    </Splitpanes>
    <DropzoneModal v-if="isOverDropZone" />
  </div>
</template>

<script setup lang="ts">
import '@kong/spec-renderer/dist/style.css'
import 'splitpanes/dist/splitpanes.css'

import { ref, computed, watch, nextTick, useTemplateRef, onMounted } from 'vue'
import { SpecRenderer } from '@kong/spec-renderer'
import { refDebounced, useDropZone, useWindowSize, watchDebounced } from '@vueuse/core'
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ChevronDownIcon, UploadIcon, VisibilityIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import { Splitpanes, Pane } from 'splitpanes'

import useApiDocOptions from '@/composables/useApiDocOptions'
import useToaster from '@/composables/useToaster'
import { loadSpecFromLocalStorage, saveSpecToLocalStorage, clearLocalStorageKey } from '@/utils/storage'

import DropzoneModal from '@/components/DropzoneModal.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import SpecEditor from '@/components/SpecEditor.vue'
import SpecToolbar from '@/components/SpecToolbar.vue'
import KongLogo from '@/components/KongLogo.vue'

// sample specifications
import specGithub from '@/assets/specs/github.json'
import specStripe from '@/assets/specs/stripe.json'
import specKongAir from '@/assets/specs/kongair.json'
import specCloudflare from '@/assets/specs/cloudflare.json'
import specStoplight from '@/assets/specs/stoplight.json'
import specOpenApiAsync from '@/assets/specs/openapi-async.json'


type TFileLabel = typeof files[number][number]['label']

// constants
const STORAGE_KEY = 'spec-renderer-playground-spec'
const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8MB
const SUPPORTED_TYPES = ['application/json', 'application/x-yaml', 'text/yaml']
const files = [
  [
    {
      label: 'Sample OpenAPI specifications',
      file: undefined,
    },
    {
      label: 'Kong Air',
      file: specKongAir,
    },
    {
      label: 'Cloudflare',
      file: specCloudflare,
    },
    {
      label: 'Github',
      file: specGithub,
    },
    {
      label: 'Stripe',
      file: specStripe,
    },
    {
      label: 'Stoplight',
      file: specStoplight,
    },
  ],
  [
    {
      label: 'Sample Async API specifications',
      file: undefined,
    },
    {
      label: 'OpenAPI Async',
      file: specOpenApiAsync,
    },
  ],
] as const

const editor = useTemplateRef('editor')
const dropZoneRef = useTemplateRef('dropzone')
const fileInputRef = useTemplateRef('fileInput')

const { width } = useWindowSize()

const isMobile = computed(() => width.value <= 768)

const defaultSpec = JSON.stringify(specKongAir, null, 2)
const code = ref(defaultSpec)
const specText = refDebounced(code, 700)

// to track if the spec has been cleared
const isCleared = ref(false)

// to track if the spec is loading
const isLoading = ref(true)

const { options } = useApiDocOptions()
const { toaster } = useToaster()

const showLeftPane = ref(isMobile.value ? false : true)

watch(isMobile, (newValue) => {
  showLeftPane.value = !newValue
})

const toggleLeftPane = () => {
  showLeftPane.value = !showLeftPane.value
}

const loadSampleSpec = async (fileLabel: TFileLabel) => {
  if (!fileLabel) {
    return
  }

  try {
    const module = files.flat().find(item => item.file && item.label === fileLabel)
    if (!module) {
      toaster.open({
        appearance: 'danger',
        message: `File not found: ${fileLabel}`,
      })
      return
    }
    code.value = JSON.stringify(module.file, null, 2)
    resetEditor()
  } catch (error) {
    console.error(`Failed to load file: ${fileLabel}`, error)
  }
}

const clearSpec = () => {
  if (isCleared.value && !code.value) return

  isCleared.value = true
  code.value = ''
  clearLocalStorageKey(STORAGE_KEY)
}

const resetEditor = () => {
  isCleared.value = false
}

const dropzoneClick = () => {
  fileInputRef.value?.click()
}

const fileUploaded = () => {
  const file = fileInputRef.value?.files?.item(0)
  if (file) {
    onDrop([file])
  }
}

const onDrop = (files: File[] | null) => {
  const file = files?.[0]
  if (!file) return

  if (file.size > MAX_FILE_SIZE) {
    toaster.open({
      appearance: 'danger',
      message: 'File is too large. Maximum allowed size is 8MB.',
    })
    return
  }

  if (!SUPPORTED_TYPES.includes(file.type)) {
    toaster.open({
      appearance: 'danger',
      message: 'Unsupported file type. Please upload a YAML or JSON format.',
    })
    return
  }

  const reader = new FileReader()
  reader.readAsText(file, 'UTF-8')
  reader.onload = async (e) => {
    if (e.target?.result) {
      code.value = e.target.result.toString()
      resetEditor()
      await nextTick()
      editor.value?.formatDocument()
    }
  }
}

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop,
  dataTypes: ['application/x-yaml', 'application/json'],
  multiple: false,
  // whether to prevent default behavior for unhandled events
  preventDefaultForUnhandled: false,
})

// save spec to localStorage
watchDebounced(specText, (newValue) => {
  if (!isCleared.value && newValue && newValue.trim() !== defaultSpec.trim()) {
    saveSpecToLocalStorage(STORAGE_KEY, newValue)
  }
}, {
  debounce: 1000,
})

onMounted(() => {
  isLoading.value = true
  const savedSpec = loadSpecFromLocalStorage(STORAGE_KEY)
  code.value = savedSpec || defaultSpec
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
})
</script>

<style lang="scss" scoped>
.spec-renderer-playground {
  background: $kui-color-background-inverse;
  font-family: 'Inter', Helvetica, Arial, sans-serif;

  * {
    box-sizing: border-box;
    margin: 0;
  }

  .editor-header {
    align-items: center;
    background-color: $kui-color-background-inverse;
    color: $kui-color-text-inverse;
    display: flex;
    height: $headerHeight;
    justify-content: space-between;
    padding: $kui-space-20 $kui-space-60;


    .header-title {
      align-items: center;
      display: inline-flex;
      gap: $kui-space-30;

      h1 {
        font-size: $kui-font-size-50;
        line-height: $kui-line-height-50;
      }

      p {
        font-size: $kui-font-size-40;
        font-weight: $kui-font-weight-regular;
        margin-left: $kui-space-60;
      }

      @media (max-width: $kui-breakpoint-mobile) {
        p {
          display: none;
        }
      }
    }

    .header-actions {
      align-items: center;
      display: inline-flex;
      gap: $kui-space-60;

      .language-selector {
        :deep(.trigger-button) {
          border: $kui-border-width-10 solid $kui-color-border;
          color: $kui-color-text-inverse;
          font-family: $kui-font-family-code;
          font-size: $kui-font-size-20;
          line-height: $kui-line-height-20;
          padding: $kui-space-20 $kui-space-30;
        }
      }

      .create-developer-portal {
        @include default-button-reset;
        background-color: $kui-color-background-transparent;
        border: $kui-border-width-20 solid $kui-color-border-inverse;
        border-radius: $kui-border-radius-30;
        color: $kui-color-text-inverse;
        cursor: pointer;
        font-size: $kui-font-size-30;
        font-weight: $kui-font-weight-semibold;
        padding: $kui-space-30 $kui-space-40;
        transition: background-color 0.2s ease-in-out,
          color 0.2s ease-in-out,
          border-color 0.2s ease-in-out;

        &:hover:not(:disabled):not(:focus):not(:active) {
          background-color: $kui-color-background-primary-weakest;
          color: $kui-color-text-primary-stronger;
        }
      }
    }

    .github-link {
      img {
        height: $kui-icon-size-40;
        vertical-align: bottom;
        width: $kui-icon-size-40;
      }
    }
  }

  .spec-container.default-theme {
    height: calc(100dvh - #{$headerHeight});
    width: 100dvw;

    .splitpanes__pane {
      background-color: $kui-color-background-transparent;
      overflow: auto;
      transition: none;
    }
  }

  .spec-renderer-pane {
    background: $kui-color-background !important;
    position: relative;

    &.collapsed {
      border-top-left-radius: $kui-border-radius-50;
      margin-left: $kui-space-60;
    }
  }

  .editor-toolbar {
    border-top-left-radius: $kui-border-radius-50;

    .file-input {
      position: absolute;
      visibility: hidden;
    }
  }

  .toolbar-title {
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
    line-height: $kui-line-height-30;
    // truncate text
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }

  .file-input-button {

    // hide text in small screens
    span {
      @media (max-width: $kui-breakpoint-mobile) {
        display: none;
      }
    }
  }
}

.pane-left {
  border-right: $kui-border-width-10 solid $kui-color-border;
  margin-left: $kui-space-60;
  overflow: hidden !important;
}

:deep(.spec-renderer-small-screen-header) {
  top: #{$toolbarHeight} !important;
  z-index: 1 !important;
}

.editor-container-state {
  margin-top: $kui-space-50;
}

:deep(.k-dropdown-item) {
  &.disabled.has-divider {
    .dropdown-item-trigger-label {
      color: $kui-color-text-neutral;
      cursor: auto;
      font-size: $kui-font-size-20;
    }
  }

  &:not(.disabled) {
    .dropdown-item-trigger-label {
      color: $kui-color-text-neutral-stronger;
    }
  }

  .dropdown-item-trigger-label {
    font-family: $kui-font-family-text;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-medium;
  }
}

.kong-logo {
  margin-left: $kui-space-20;
}

:deep(.fullscreen-loading-container) {
  position: absolute !important;
  top: 44px !important;
  // we need to set a lower z-index than the SettingsModal
  z-index: 9 !important;
}
</style>
