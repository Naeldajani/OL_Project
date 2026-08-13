// Client-side lookup of a person's photo via Wikipedia's public REST API
// (CORS-enabled, no key required). Runs in the visitor's browser, not this
// build environment, and fails silently to `null` so callers fall back to
// the stylized avatar — including inside CSP-sandboxed previews where all
// cross-origin requests are blocked outright.

const cache = new Map<string, Promise<string | null>>()

async function fetchSummary(title: string, signal: AbortSignal): Promise<string | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  const res = await fetch(url, { signal, headers: { accept: 'application/json' } })
  if (!res.ok) return null
  const data = await res.json()
  if (data.type === 'disambiguation') return null
  return data.thumbnail?.source ?? data.originalimage?.source ?? null
}

async function lookup(name: string): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4000)
  try {
    const variants = [`${name} (footballer)`, name]
    for (const title of variants) {
      try {
        const src = await fetchSummary(title, controller.signal)
        if (src) return src
      } catch {
        // try next variant
      }
    }
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export function getPersonPhoto(name: string): Promise<string | null> {
  if (!cache.has(name)) cache.set(name, lookup(name))
  return cache.get(name)!
}
