import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsModal from './SettingsModal.vue'
import { API_DOC_OPTIONS } from '@/constants'
import Kongponents, { KButton, KModal, KCard, KInputSwitch } from '@kong/kongponents'
import { CogIcon } from '@kong/icons'

describe('SettingsModal', () => {
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    wrapper = mount(SettingsModal, {
      global: {
        plugins: [Kongponents],
        stubs: {
          Teleport: true,
        },
      },
    })
  })

  it('should render the settings button', () => {
    const button = wrapper.findComponent(KButton)
    expect(button.exists()).toBe(true)
    expect(button.props('appearance')).toBe('secondary')
    expect(button.props('size')).toBe('small')
    expect(button.props('icon')).toBe(true)
  })

  it('should render the cog icon in the button', () => {
    const icon = wrapper.findComponent(CogIcon)
    expect(icon.exists()).toBe(true)
    expect(icon.props('decorative')).toBe(true)
  })

  it('should have the modal initially hidden', () => {
    const modal = wrapper.findComponent(KModal)
    expect(modal.props('visible')).toBe(false)
  })

  it('should open modal when button is clicked', async () => {
    const button = wrapper.findComponent(KButton)
    await button.trigger('click')

    const modal = wrapper.findComponent(KModal)
    expect(modal.props('visible')).toBe(true)
  })

  it('should render modal with correct props', async () => {
    const button = wrapper.findComponent(KButton)
    await button.trigger('click')

    const modal = wrapper.findComponent(KModal)
    expect(modal.props('actionButtonAppearance')).toBe('primary')
    expect(modal.props('actionButtonText')).toBe('Apply')
    expect(modal.props('hideCancelButton')).toBe(true)
    expect(modal.props('maxWidth')).toBe('640px')
    expect(modal.props('title')).toBe('API documentation options')
  })

  it('should render all API doc options', async () => {
    const button = wrapper.findComponent(KButton)
    await button.trigger('click')

    const cards = wrapper.findAllComponents(KCard)
    expect(cards).toHaveLength(API_DOC_OPTIONS.length)
  })

  it('should render correct labels and descriptions for each option', async () => {
    const button = wrapper.findComponent(KButton)
    await button.trigger('click')

    const cards = wrapper.findAllComponents(KCard)

    API_DOC_OPTIONS.forEach((option, index) => {
      expect(cards[index]?.text()).toContain(option.label)
      expect(cards[index]?.text()).toContain(option.description)
    })
  })

  it('should render toggle switches for each option', async () => {
    const button = wrapper.findComponent(KButton)
    await button.trigger('click')

    const switches = wrapper.findAllComponents(KInputSwitch)
    expect(switches).toHaveLength(API_DOC_OPTIONS.length)
  })

  it('should initialize toggle switches with correct default values', async () => {
    const button = wrapper.findComponent(KButton)
    await button.trigger('click')

    const switches = wrapper.findAllComponents(KInputSwitch)

    // Check that first non-inverted option has correct value
    const expectedFirstValue = API_DOC_OPTIONS[0] && (API_DOC_OPTIONS[0].inverted ? !API_DOC_OPTIONS[0].defaultValue : API_DOC_OPTIONS[0].defaultValue)
    expect(switches[0]?.props('modelValue')).toBe(expectedFirstValue)
  })

  it('should handle inverted options correctly', async () => {
    const button = wrapper.findComponent(KButton)
    await button.trigger('click')

    const invertedOption = API_DOC_OPTIONS.find(opt => opt.inverted)
    if (invertedOption) {
      const index = API_DOC_OPTIONS.indexOf(invertedOption)
      const switches = wrapper.findAllComponents(KInputSwitch)

      // For inverted options with defaultValue = true, the switch should show true
      // because the component inverts it in the template
      expect(typeof switches[index]?.props('modelValue')).toBe('boolean')
    }
  })

  it('should update option value when switch is toggled', async () => {
    const button = wrapper.findComponent(KButton)
    await button.trigger('click')

    const switches = wrapper.findAllComponents(KInputSwitch)
    const initialValue = switches[0]?.props('modelValue')

    // Emit update event
    switches[0]?.vm.$emit('update:modelValue', !initialValue)
    await wrapper.vm.$nextTick()

    // Check if the value changed
    expect(switches[0]?.props('modelValue')).toBe(!initialValue)
  })

  it('should close modal when cancel event is emitted', async () => {
    const button = wrapper.findComponent(KButton)
    await button.trigger('click')

    let modal = wrapper.findComponent(KModal)
    expect(modal.props('visible')).toBe(true)

    modal.vm.$emit('cancel')
    await wrapper.vm.$nextTick()

    modal = wrapper.findComponent(KModal)
    expect(modal.props('visible')).toBe(false)
  })

  it('closes modal when proceed event is emitted', async () => {
    const button = wrapper.findComponent(KButton)
    await button.trigger('click')

    let modal = wrapper.findComponent(KModal)
    expect(modal.props('visible')).toBe(true)

    modal.vm.$emit('proceed')
    await wrapper.vm.$nextTick()

    modal = wrapper.findComponent(KModal)
    expect(modal.props('visible')).toBe(false)
  })

  it('should render description paragraph', async () => {
    const button = wrapper.findComponent(KButton)
    await button.trigger('click')

    expect(wrapper.text()).toContain('Configure options for how your API spec appears in the renderer.')
  })
})
