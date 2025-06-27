export function isJsonOrYaml(content: string): 'json' | 'yaml' {
  if (content.startsWith('{') || content.startsWith('[')) {
    return 'json'
  } else {
    return 'yaml'
  }
}
