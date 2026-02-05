/**
 * PNG Generator using html-to-image
 * For client-side screenshot generation
 */

/**
 * Generate PNG data URL from a DOM element
 * Usage: const dataUrl = await generatePNG('monthly-summary')
 *
 * Requires html-to-image:
 * import { toPng } from 'html-to-image'
 */
export async function generatePNG(elementId: string): Promise<string> {
  // Dynamic import to avoid SSR issues
  const { toPng } = await import('html-to-image')

  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  const dataUrl = await toPng(element, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    style: {
      padding: '24px',
    },
  })

  return dataUrl
}

/**
 * Download PNG file from data URL
 */
export function downloadPNG(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

/**
 * Generate and download PNG in one step
 */
export async function generateAndDownloadPNG(
  elementId: string,
  filename: string
): Promise<void> {
  const dataUrl = await generatePNG(elementId)
  downloadPNG(dataUrl, filename)
}
