<template>
  <div class="base-modal">
    <slot
      name="trigger"
      :toggle-modal="toggleModal"
    >
      <button @click="toggleModal">
        Trigger
      </button>
    </slot>

    <Teleport to="body">
      <div
        v-if="isOpen"
        class="modal-container"
      >
        <div
          ref="modalContent"
          class="modal-content"
        >
          <slot :toggle-modal="toggleModal" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'

const isOpen = ref(false)

const modalContainer = useTemplateRef('modalContent')

const toggleModal = () => {
  isOpen.value = !isOpen.value
}

onClickOutside(modalContainer, toggleModal)

onKeyStroke('Escape', (e) => {
  if (isOpen.value) {
    e.preventDefault()
    isOpen.value = false
  }
})

</script>

<style lang="scss" scoped>
.modal-container {
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 9999;
}
</style>
