<template>
  <Teleport to="body">
    <KModal
      :action-button-disabled="isImporting || !url.trim()"
      action-button-text="Import"
      max-width="520px"
      title="Import API specification"
      :visible="visible"
      @cancel="$emit('cancel')"
      @proceed="$emit('import')"
    >
      <p>
        Enter a public URL for an OpenAPI specification in YAML or JSON format.
      </p>
      <KInput
        v-model="url"
        class="spec-url-input"
        data-testid="spec-url-input"
        placeholder="https://example.com/openapi.yaml"
        type="url"
        @keydown.enter="$emit('import')"
      />
    </KModal>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  isImporting: boolean
  visible: boolean
}>()

defineEmits<{
  cancel: []
  import: []
}>()

const url = defineModel<string>('url', {
  required: true,
})
</script>
