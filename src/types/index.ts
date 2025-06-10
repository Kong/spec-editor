export interface ApiDocOption {
  /*
  * The property name used in the options object.
  *
  * !IMPORTANT: This must match the prop names in SpecRenderer
  */
  prop: 'allow-content-scrolling' | 'allow-custom-server-url' | 'markdown-styles' | 'hide-try-it' | 'hide-schemas' | 'hide-deprecated'
  /**
   * The label displayed in the UI for this option.
   */
  label: string
  /**
   * A brief description of what this option does.
   */
  description: string
  /**
   * The default value for this option.
   *
   * This is used to initialize the options object in useApiDocOptions.
   */
  defaultValue: boolean
}
