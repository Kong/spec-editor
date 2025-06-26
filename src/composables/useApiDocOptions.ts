import { ref } from 'vue'
import { API_DOC_OPTIONS } from '@/constants'

const options = ref(
  API_DOC_OPTIONS.reduce((acc: Record<string, boolean>, curr) => {
    // If the option is inverted, invert the default value - (e.g. the label might say "show" but the action is "hide")
    acc[curr.prop] = curr.inverted ? !curr.defaultValue : curr.defaultValue
    return acc
  }, {}),
)

export default function useApiDocOptions() {

  return {
    options,
  }
}
