/** Helpers for accepting Canva links / embed HTML and rendering slides. */

/** Pull the iframe src out of a pasted HTML embed snippet; otherwise return the trimmed input. */
export function extractEmbedSrc(input: string): string {
  const trimmed = input.trim()
  const match = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)
  return match ? match[1] : trimmed
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i

export function isImageUrl(url: string): boolean {
  return IMAGE_EXT.test(url)
}

/** True when the URL should be embedded in an iframe (Canva link, or any non-image URL). */
export function isEmbeddableUrl(url: string): boolean {
  if (isImageUrl(url)) return false
  return /^https?:\/\//i.test(url)
}

/** Normalise a Canva design "view" URL to its embeddable form (adds ?embed). */
export function toCanvaEmbedSrc(url: string): string {
  try {
    const u = new URL(url)
    const isCanva = /(^|\.)canva\.(com|link)$/i.test(u.hostname)
    if (isCanva && /\/design\//i.test(u.pathname) && !u.searchParams.has('embed')) {
      u.searchParams.set('embed', '')
      // URL serialises embed= with trailing "=", but Canva accepts ?embed too
      return u.toString().replace(/embed=$/, 'embed').replace(/embed=&/, 'embed&')
    }
    return url
  } catch {
    return url
  }
}
