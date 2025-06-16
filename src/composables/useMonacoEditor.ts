import { watch, computed, ref, reactive, onBeforeUnmount, nextTick, onMounted } from 'vue'
import type { Ref } from 'vue'
import { KUI_FONT_FAMILY_CODE, KUI_FONT_SIZE_20, KUI_FONT_WEIGHT_MEDIUM, KUI_LINE_HEIGHT_30 } from '@kong/design-tokens'
import { onClickOutside } from '@vueuse/core'

// Monaco editor imports
import * as monaco from 'monaco-editor'
// @ts-ignore - module exists
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'
// @ts-ignore - module exists
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker'
// @ts-ignore - module exists
// import YamlWorker from 'monaco-editor/esm/vs/language/yaml/yaml.worker.js?worker'

// Shiki highlighter
import { shikiToMonaco } from '@shikijs/monaco'
import { createHighlighter } from 'shiki'
import type { HighlighterGeneric, BundledLanguage, BundledTheme } from 'shiki'

interface UseMonacoEditorOptions {
  /** Is the Editor readonly. */
  readOnly?: boolean
  /** The editor code/content. */
  code: Ref<string>
  /** The Editor language (see supported languages in the composable). */
  language: string
  /** Force the theme into light or dark mode */
  forceTheme?: 'light' | 'dark'
  onChanged?: (content: string) => void
  onCreated?: () => void
  /**
   * Additional Monaco editor settings
   * @see https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneEditorConstructionOptions.html
  */
  monacoOptions?: monaco.editor.IStandaloneEditorConstructionOptions
}

const SHIKI_THEMES: Record<string, BundledTheme> = {
  light: 'catppuccin-latte',
  dark: 'catppuccin-mocha',
}

// Create a singleton for the monaco instance
let monacoInstance: typeof monaco
// Create a singleton instance of the Shiki highlighter
let shikiHighlighter: HighlighterGeneric<BundledLanguage, BundledTheme>

/**
 * Set up the Monaco editor instance singleton.
 *
 * !Important: Only include code here that is language-agnostic.
 *
 * @returns {Promise<{ monacoInstance: typeof monaco }>}
 */
const setupMonaco = async (): Promise<{ monacoInstance: typeof monaco }> => {
  // If the instance is already initialized, exit early
  if (monacoInstance) {
    return { monacoInstance }
  }

  window.MonacoEnvironment = {
    getWorker(_: any, label: string) {
      if (label === 'json') return new JsonWorker()
      return new EditorWorker()
    },
  }

  monacoInstance = monaco

  monacoInstance.languages.register({ id: 'yaml' })
  monacoInstance.languages.register({ id: 'json' })

  // Create the highlighter
  if (!shikiHighlighter) {
    shikiHighlighter = await createHighlighter({
      themes: Object.values(SHIKI_THEMES),
      langs: [
        'txt',
        'yaml',
        'json',
        'plaintext',
      ],
    })
  }

  setTimeout(() => {
    shikiToMonaco(shikiHighlighter, monacoInstance)
  }, 100)

  return { monacoInstance }
}


export default function useMonacoEditor(target: Ref, options: UseMonacoEditorOptions) {
  const isSetup = ref<boolean>(false)
  let editor: monaco.editor.IStandaloneCodeEditor | undefined
  const _theme = ref<'light' | 'dark'>('light')
  const cursorPosition = reactive<{ lineNumber: number, column: number }>({ lineNumber: 0, column: 0 })

  const hasTextFocus = ref<boolean>(false)

  /** The current states of editor widgets */
  const editorStates = reactive({
    searchBoxIsRevealed: false,
  })

  /** The current editor theme, `light` or `dark` */
  const editorTheme = computed((): 'light' | 'dark' => {
    if (options.forceTheme && ['light', 'dark'].includes(options.forceTheme)) {
      return options.forceTheme
    }

    return _theme.value
  })

  /** Set the editor content */
  const setContent = (content: string) => {
    if (!isSetup.value) {
      return
    }
    if (editor) {
      editor.setValue(content)
    }
  }

  /** Set the editor readonly mode */
  const setReadOnly = (isReadOnly: boolean): void => {
    if (editor) {
      editor.updateOptions({ readOnly: isReadOnly })
    }
  }

  const storeCursorPosition = (): void => {
    if (!isSetup.value || !editor) {
      return
    }

    const position = editor.getPosition()
    const lineNumber = position?.lineNumber || 0
    const column = position?.column || 0

    cursorPosition.lineNumber = lineNumber
    cursorPosition.column = column
  }

  /** Focus on the editor */
  const focus = async (): Promise<void> => {
    if (!isSetup.value || !editor) {
      return
    }
    // Wait .3 seconds for transition to finish
    setTimeout(async () => {
      if (!editor) return
      // Set the cursor position to the end of the document
      editor.setPosition({ lineNumber: cursorPosition.lineNumber, column: cursorPosition.column })
      // Optional: Scroll the editor to reveal the cursor position
      editor.revealPositionInCenter({ lineNumber: cursorPosition.lineNumber, column: cursorPosition.column })
      // Focus on the editor
      editor?.focus()
    }, 300)
  }

  /**
   * Triggers a keyboard command in the Monaco editor.
   *
   * @param {string} id - The unique identifier of the editor command to trigger.
   */
  const triggerKeyboardCommand = (id: string) => {
    try {
      if (!editor || !id) return
      editor.focus()
      editor.trigger('keyboard', id, null)
    } catch (error) {
      console.error(`useMonacoEditor: Failed to trigger command: ${id}`, error)
    }
  }

  const formatDocument = async () => {
    try {
      if (!isSetup.value || !editor) {
        return
      }

      await editor.getAction('editor.action.formatDocument')?.run()
    } catch (error: any) {
      console.error('useMonacoEditor: Failed to format monaco-editor content.', error)
    }
  }

  /** Toggle the status of findController widget */
  const toggleSearchWidget = () => {
    try {
      if (!editor) return

      // close the widget
      if (editorStates.searchBoxIsRevealed) {
        // @ts-ignore - property exists
        return editor!.getContribution('editor.contrib.findController')?.closeFindWidget()
      }

      triggerKeyboardCommand('actions.find')
    } catch (error: any) {
      console.error('useMonacoEditor: Failed to close findController.', error)
    }
  }

  const init = async () => {
    const { monacoInstance } = await setupMonaco()

    watch(target, (el) => {
      if (!el) {
        return
      }

      let lang = options.language

      if (lang === 'yaml') {
        lang = 'yaml'
      } else if (lang === 'json') {
        lang = 'json'
      }

      const extension = () => {
        if (lang === 'yaml') return 'yaml'
        if (lang === 'json') return 'json'
        return 'txt'
      }
      const model = monacoInstance.editor.createModel(
        options.code.value,
        lang,
        monacoInstance.Uri.parse(`file:///root/${Date.now()}.${extension()}`),
      )

      // Create Monaco editor
      editor = monacoInstance.editor.create(el, {
        autoClosingQuotes: 'always',
        automaticLayout: true, // Auto resize layout
        bracketPairColorization: {
          enabled: true,
        },
        fontFamily: KUI_FONT_FAMILY_CODE,
        fontSize: Number(KUI_FONT_SIZE_20.replace('px', '')),
        fontWeight: KUI_FONT_WEIGHT_MEDIUM,
        lineHeight: Number(KUI_LINE_HEIGHT_30.replace('px', '')),
        formatOnPaste: true,
        formatOnType: true, // Add to enable automatic formatting as the user types.
        glyphMargin: false,
        language: lang,
        lineNumbersMinChars: 3,
        minimap: {
          enabled: false,
        },
        stickyScroll: {
          enabled: true,
        },
        model,
        suggest: {
          showWords: false, // Prevent showing word suggestions that exist in the document
        },
        quickSuggestions: true, // Enable quick suggestions
        suggestOnTriggerCharacters: true, // Allow suggestions on trigger characters
        wordBasedSuggestions: 'off',
        overviewRulerLanes: 0,
        readOnly: options.readOnly,
        renderWhitespace: 'boundary',
        scrollBeyondLastLine: false,
        roundedSelection: false,
        colorDecorators: true,
        folding: true, // Enable code folding for MDC block components
        fixedOverflowWidgets: true, // Ensure suggestion widgets can overflow container
        tabSize: 2, // Utilize the same tabSize used in the format providers
        detectIndentation: false, // Important as to not override tabSize
        insertSpaces: true, // Since the formatter utilizes spaces, we set to true to insert spaces when pressing Tab
        theme: editorTheme.value === 'dark' ? SHIKI_THEMES.dark : SHIKI_THEMES.light,
        trimAutoWhitespace: true,
        wordWrap: 'bounded',
        find: {
          addExtraSpaceOnTop: false, // we need this set to false to get the correct absolute position, otherwise when the search box opens the content shifts
        },
        ...options.monacoOptions || {},
      })

      isSetup.value = true

      if (typeof options?.onCreated === 'function') {
        options.onCreated()
      }

      editor!.onDidChangeModelContent(() => {
        if (typeof options.onChanged === 'function') {
          options.onChanged?.(editor!.getValue())
        }
      })

      editor!.onDidBlurEditorText(storeCursorPosition)

      try {
        // Access the internal "FindController" contribution
        const findController = editor.getContribution('editor.contrib.findController')

        if (findController) {
          // Get the state object from the FindController
          // @ts-ignore - getState exists
          const findState = findController.getState()

          // Listen for changes to the state of the "find" panel
          findState.onFindReplaceStateChange(() => {
            if (findState.isRevealed) {
              editorStates.searchBoxIsRevealed = true
            } else {
              editorStates.searchBoxIsRevealed = false
            }
          })
        }
      } catch (error) {
        console.error('useMonacoEditor: Failed to get the state of findController', error)
      }


      editor?.onDidFocusEditorText((): void => {
        if (!hasTextFocus.value) {
          hasTextFocus.value = true
        }
      })
    },
    { immediate: true, flush: 'post' },
    )
  }

  onClickOutside(target, () => {
    if (hasTextFocus.value) {
      hasTextFocus.value = false
    }
  })

  // Init the Monaco editor
  onMounted(async () => {
    await nextTick()
    await init()
    await nextTick()
  })

  onBeforeUnmount(() => {
    editor?.dispose()
    // !Important: do not dispose the shiki highlighter
  })

  return {
    editor,
    editorTheme,
    editorStates: computed(() => editorStates),
    hasTextFocus: computed(() => hasTextFocus.value),
    // Methods
    setContent,
    setReadOnly,
    focus,
    triggerKeyboardCommand,
    formatDocument,
    toggleSearchWidget,
  }
}
