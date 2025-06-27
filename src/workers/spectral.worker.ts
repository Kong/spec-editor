import { Spectral } from '@stoplight/spectral-core'
import { DiagnosticSeverity } from '@stoplight/types'
import { bundleAndLoadRuleset } from '@stoplight/spectral-ruleset-bundler/with-loader'

const ctx: Worker = self as any

const severityMap = {
  [DiagnosticSeverity.Error]: 8,
  [DiagnosticSeverity.Warning]: 4,
  [DiagnosticSeverity.Information]: 2,
  [DiagnosticSeverity.Hint]: 1,
}

ctx.addEventListener('message', async (event) => {
  const { rawText, language } = event.data

  const ruleset = 'extends: spectral:oas\nrules: {}'
  const mockFs = {
    promises: {
      async readFile(filepath: string): Promise<string> {
        if (filepath === '/.spectral.yaml') return ruleset
        throw new Error(`Could not read ${filepath}`)
      },
    },
  }

  try {
    const spectral = new Spectral()
    // @ts-expect-error: allow mock fetch and fs
    await spectral.setRuleset(await bundleAndLoadRuleset('/.spectral.yaml', { fs: mockFs, fetch }))

    const parsedInput = language === 'json' ? JSON.parse(rawText) : rawText
    const results = await spectral.run(parsedInput)

    const markers = results.map(res => ({
      message: res.message,
      startLineNumber: res.range.start.line + 1,
      startColumn: res.range.start.character + 1,
      endLineNumber: res.range.end.line + 1,
      endColumn: res.range.end.character + 1,
      severity: severityMap[res.severity],
    }))

    ctx.postMessage({ markers })
  } catch (error) {
    console.error('[SpectralWorker] Error running spectral:', error)
    ctx.postMessage({ markers: [] })
  }
})
