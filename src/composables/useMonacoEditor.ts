import { watch, computed, ref, reactive, onBeforeUnmount, onMounted } from 'vue'
import type { Ref } from 'vue'
import { KUI_FONT_FAMILY_CODE, KUI_FONT_SIZE_20, KUI_FONT_WEIGHT_MEDIUM, KUI_LINE_HEIGHT_30 } from '@kong/design-tokens'
import { onClickOutside, useDebounceFn } from '@vueuse/core'
import { isJsonOrYaml } from '@/utils/oas'

// Monaco editor imports
import type { editor as IEditor } from 'monaco-editor'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type IMonacoEditor = typeof import('monaco-editor')
// @ts-ignore - module exists
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'
// @ts-ignore - module exists
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker'

// Shiki highlighter
import { shikiToMonaco } from '@shikijs/monaco'
import { createHighlighter } from 'shiki'
import type { HighlighterGeneric, BundledLanguage, BundledTheme } from 'shiki'

// Spectral Linter Worker
let SpectralWorkerCtor: any | undefined

interface UseMonacoEditorOptions {
  /**
   * Is the Editor readonly.
   *
   * @default false
   * */
  readOnly?: boolean
  /** The editor code/content. */
  code: Ref<string>
  /**
   * The Editor language (see supported languages in the composable).
   *
   * @default 'json'
   */
  language?: 'json' | 'yaml'
  /**
   * Force the theme into light or dark mode
   *
   * @default 'light'
   */
  forceTheme?: 'light' | 'dark'
  onChanged?: (content: string) => void
  onCreated?: () => void
  /**
   * Additional Monaco editor settings
   * @see https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneEditorConstructionOptions.html
  */
  monacoOptions?: IEditor.IStandaloneEditorConstructionOptions
}

const SHIKI_THEMES: Record<string, BundledTheme> = {
  light: 'catppuccin-latte',
  dark: 'catppuccin-mocha',
}

// Create a singleton for the monaco instance
let monacoInstance: IMonacoEditor
// Create a singleton instance of the Shiki highlighter
let shikiHighlighter: HighlighterGeneric<BundledLanguage, BundledTheme>
// Create a singleton for the Spectral worker
let spectralWorker: Worker | null = null

const setupMonaco = async (): Promise<{ monacoInstance: IMonacoEditor }> => {
  if (monacoInstance) {
    return { monacoInstance }
  }

  window.MonacoEnvironment = {
    getWorker(_: any, label: string) {
      if (label === 'json') return new JsonWorker()
      return new EditorWorker()
    },
  }

  // Dynamic imports to avoid SSR loading
  monacoInstance = await import('monaco-editor')

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
  }, 200)

  return { monacoInstance }
}


export default function useMonacoEditor(target: Ref, options: UseMonacoEditorOptions) {
  const isSetup = ref<boolean>(false)
  let editor: IEditor.IStandaloneCodeEditor | undefined
  const _theme = ref<'light' | 'dark'>('light')
  const _lang = ref<'json' | 'yaml'>('json')
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
    if (!isSetup.value || !editor) return
    editor.setValue(content)
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

    // Lazy-load Spectral Worker constructor
    if (!SpectralWorkerCtor) {
      SpectralWorkerCtor = (await import('@/workers/spectral.worker?worker')).default
    }

    const { monacoInstance } = await setupMonaco()

    watch(target, (el) => {
      if (!el) {
        return
      }

      if (options.language) {
        _lang.value = options.language
      }

      const model = monacoInstance.editor.createModel(
        options.code.value,
        _lang.value,
        monacoInstance.Uri.parse(`file:///root/${Date.now()}.${_lang.value}`),
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
        language: _lang.value,
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

      // watch for code changes
      watch(options.code, (newValue) => {
        if (!editor) return
        const currentValue = editor.getValue()
        if (newValue !== currentValue) {
          _lang.value = isJsonOrYaml(newValue)
          monacoInstance.editor.setModelLanguage(model, _lang.value)
          setContent(newValue)
        }
      })


      if (typeof options?.onCreated === 'function') {
        options.onCreated()
      }

      setupSpectralWorker(model)

      const postSpectralLintDebounced = useDebounceFn((value) => {
        spectralWorker?.postMessage({
          rawText: value,
          language: _lang.value,
        })
      }, 1000)

      // Initial linting of the document
      postSpectralLintDebounced(options.code.value)

      editor.onDidChangeModelContent(() => {
        const value = editor!.getValue()

        if (typeof options.onChanged === 'function') {
          options.onChanged?.(value)
        }

        postSpectralLintDebounced(value)
      })

      editor.onDidBlurEditorText(storeCursorPosition)

      try {
        // Access the internal "FindController" contribution
        const findController = editor.getContribution('editor.contrib.findController')

        if (findController) {
          // Get the state object from the FindController
          // @ts-ignore - getState exists
          const findState = findController.getState()

          // Listen for changes to the state of the "find" panel
          findState.onFindReplaceStateChange(() => {
            editorStates.searchBoxIsRevealed = findState.isRevealed
          })
        }
      } catch (error) {
        console.error('useMonacoEditor: Failed to get the state of findController', error)
      }


      editor.onDidFocusEditorText((): void => {
        if (!hasTextFocus.value) {
          hasTextFocus.value = true
        }
      })

      editor.onDidPaste((): void => {
        const content = editor?.getValue() || ''
        _lang.value = isJsonOrYaml(content)
        monacoInstance.editor.setModelLanguage(model, _lang.value)
        formatDocument()
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
  onMounted(() => {
    init()
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

function setupSpectralWorker(model: IEditor.ITextModel) {
  if (!SpectralWorkerCtor) return
  if (!spectralWorker) spectralWorker = new SpectralWorkerCtor()

  spectralWorker!.onmessage = (event) => {
    const { markers } = event.data
    monacoInstance.editor.setModelMarkers(model, 'spectral', markers)
  }
}
