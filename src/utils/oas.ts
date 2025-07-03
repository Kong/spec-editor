/**
 * Checks if the provided content is in JSON or YAML format.
 *
 * @param content The content to check if it is JSON or YAML
 * @returns 'json' if the content is JSON, 'yaml' if it is YAML
 */
export const isJsonOrYaml = (content: string): 'json' | 'yaml' => {
  if (content.startsWith('{') || content.startsWith('[')) {
    return 'json'
  } else {
    return 'yaml'
  }
}
