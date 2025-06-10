<template>
  <header class="spec-toolbar">
    <div
      v-if="!!$slots.left"
      class="left"
    >
      <slot name="left" />
    </div>
    <div
      v-if="!!$slots.center"
      class="center"
    >
      <slot name="center" />
    </div>
    <div
      v-if="!!$slots.right"
      class="right"
    >
      <slot name="right" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
$defaultHeight: 44px;

.spec-toolbar {
  align-items: center;
  background: $kui-color-background;
  border-bottom: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  justify-content: space-between;
  min-height: $defaultHeight;
  overflow-x: auto;
  overflow-y: hidden;
  padding-left: $kui-space-40;
  padding-right: $kui-space-40;
  position: sticky;
  scrollbar-width: thin;
  top: 0px;
  // to show over the spec-renderer menu
  // TODO: find a better way to handle this
  z-index: 1001;
}

.left,
.right,
.center {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
  height: 100%;
}

.left,
.right {
  flex: 1 1 0%;
}

.right {
  justify-content: flex-end;
}
</style>
