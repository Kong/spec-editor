import { ref } from 'vue'
import { API_DOC_OPTIONS } from '@/constants'

const options = ref({
  ...API_DOC_OPTIONS.reduce((acc: Record<string, boolean>, curr) => {
    acc[curr.prop] = curr.defaultValue
    return acc
  }, {}),
})

export default function useApiDocOptions() {

  return {
    options,
  }
}
