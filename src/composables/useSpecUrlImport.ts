import { ref } from 'vue'
import { parse } from '@stoplight/yaml'

const SPEC_URL_QUERY_PARAM = 'url'

export default function useSpecUrlImport({
  onImported,
  onInvalidUrl,
}: {
  onImported: (specText: string, url: string) => Promise<void> | void
  onInvalidUrl: () => void
}) {
  const isImportingSpecUrl = ref(false)
  const isUrlImportModalVisible = ref(false)
  const shareSpecUrl = ref('')
  const specUrlInput = ref('')

  const clearSpecUrlQueryParam = () => {
    shareSpecUrl.value = ''
    replaceCurrentSpecUrlQueryParam(null)
  }

  const openUrlImportModal = () => {
    specUrlInput.value = getSpecUrlQueryParam() || specUrlInput.value
    isUrlImportModalVisible.value = true
  }

  const closeUrlImportModal = () => {
    if (isImportingSpecUrl.value) return
    isUrlImportModalVisible.value = false
  }

  const importSpecFromInputUrl = async () => {
    await importSpecFromUrl(specUrlInput.value)
  }

  const importSpecFromUrl = async (rawUrl: string) => {
    const url = rawUrl.trim()

    if (!url || isImportingSpecUrl.value) return

    isImportingSpecUrl.value = true

    try {
      assertValidSpecUrl(url)

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch spec URL')

      const text = await response.text()
      assertValidOpenApiSpec(text)

      shareSpecUrl.value = createShareSpecUrl(url)
      replaceCurrentSpecUrlQueryParam(url)
      isUrlImportModalVisible.value = false
      await onImported(text, url)
    } catch (error) {
      console.error('Failed to import spec from URL:', error)
      onInvalidUrl()
    } finally {
      isImportingSpecUrl.value = false
    }
  }

  const initializeSpecUrlInput = () => {
    const specUrl = getSpecUrlQueryParam() || ''

    specUrlInput.value = specUrl
  }

  return {
    closeUrlImportModal,
    clearSpecUrlQueryParam,
    getSpecUrlQueryParam,
    importSpecFromInputUrl,
    importSpecFromUrl,
    initializeSpecUrlInput,
    isImportingSpecUrl,
    isUrlImportModalVisible,
    openUrlImportModal,
    shareSpecUrl,
    specUrlInput,
  }
}

const assertValidOpenApiSpec = (text: string) => {
  const spec = parse<unknown>(text)

  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
    throw new Error('Spec is not an object')
  }

  const openApiVersion = (spec as { openapi?: unknown, swagger?: unknown }).openapi
  const swaggerVersion = (spec as { openapi?: unknown, swagger?: unknown }).swagger
  const info = (spec as { info?: unknown }).info
  const paths = (spec as { paths?: unknown }).paths

  if (
    (typeof openApiVersion !== 'string' || !openApiVersion.trim()) &&
    swaggerVersion !== '2.0'
  ) {
    throw new Error('Spec is not an OpenAPI document')
  }

  if (!info || typeof info !== 'object' || Array.isArray(info)) {
    throw new Error('Spec is missing required info object')
  }

  if (!paths || typeof paths !== 'object' || Array.isArray(paths)) {
    throw new Error('Spec is missing required paths object')
  }
}

const assertValidSpecUrl = (url: string) => {
  const parsedUrl = new URL(url)

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Spec URL must use http or https')
  }
}

const getSpecUrlQueryParam = () => {
  return new URLSearchParams(window.location.search).get(SPEC_URL_QUERY_PARAM)
}

const createShareSpecUrl = (url: string) => {
  const shareUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
  shareUrl.searchParams.set(SPEC_URL_QUERY_PARAM, url)

  return shareUrl.toString()
}

const replaceCurrentSpecUrlQueryParam = (url: string | null) => {
  const nextUrl = new URL(window.location.href)

  if (url) {
    nextUrl.searchParams.set(SPEC_URL_QUERY_PARAM, url)
  } else {
    nextUrl.searchParams.delete(SPEC_URL_QUERY_PARAM)
  }

  window.history.replaceState({}, '', nextUrl)
}
