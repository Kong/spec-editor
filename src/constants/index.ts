import type { ApiDocOption } from '@/types'

export const API_DOC_OPTIONS: ApiDocOption[] = [
  {
    prop: 'allow-content-scrolling',
    label: 'Continuous scroll',
    description: 'Display the full spec on a single, scrollable page. If disabled, documentation, endpoints, and schemas appear on separate pages.',
    defaultValue: true,
  },
  {
    prop: 'allow-custom-server-url',
    label: 'Allow custom server URL',
    description: 'Let users define a custom server URL for endpoints. This will be used to generate code snippets and to test the API. The URL is client-side only and is not saved.',
    defaultValue: true,
  },
  {
    prop: 'markdown-styles',
    label: 'Enhanced markdown styles',
    description: 'Applies typography styles to improve the readability of markdown content in the API description and text blocks.',
    defaultValue: true,
  },
  {
    prop: 'hide-try-it',
    label: 'Show try it',
    description: 'Enable in-browser testing for your APIs. All linked gateways must have the CORS plugin configured. Read documentation',
    defaultValue: true,
    inverted: true,
  },
  {
    prop: 'hide-schemas',
    label: 'Show schemas',
    description: 'Control whether schemas are visible in your API specs. When enabled, schemas appear in the side navigation below the endpoints.',
    defaultValue: true,
    inverted: true,
  },
  {
    prop: 'hide-deprecated',
    label: 'Hide deprecated endpoints',
    description: 'Manage visibility of deprecated endpoints and models.',
    defaultValue: false,
  },
]
