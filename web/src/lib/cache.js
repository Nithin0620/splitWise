const PREFIX = 'sw_cache_v1'
const MAX_ENTRIES = 150

const CACHEABLE_PATHS = [
  /^\/trips(?:\/|$)/,
  /^\/expenses(?:\/|$)/,
  /^\/settlements(?:\/|$)/,
]

let namespace = 'anon'

export function setCacheNamespace(userId) {
  namespace = userId ? String(userId) : 'anon'
}

export function isCacheable(url = '') {
  return CACHEABLE_PATHS.some((pattern) => pattern.test(url))
}

function stableParams(params) {
  if (!params) return ''
  try {
    return Object.keys(params)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
      .join('&')
  } catch {
    return ''
  }
}

function cacheKey(url, params) {
  return `${PREFIX}:${namespace}:${url}:${stableParams(params)}`
}

function storageKeys() {
  try {
    return Object.keys(localStorage).filter((key) => key.startsWith(PREFIX))
  } catch {
    return []
  }
}

function prune() {
  const prefix = `${PREFIX}:${namespace}:`
  const entries = storageKeys()
    .filter((key) => key.startsWith(prefix))
    .map((key) => {
      try {
        return { key, savedAt: JSON.parse(localStorage.getItem(key))?.savedAt ?? 0 }
      } catch {
        return { key, savedAt: 0 }
      }
    })
    .sort((a, b) => b.savedAt - a.savedAt)

  entries.slice(MAX_ENTRIES).forEach(({ key }) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignore storage failures.
    }
  })
}

export function readCache(url, params) {
  try {
    const raw = localStorage.getItem(cacheKey(url, params))
    if (!raw) return null
    const entry = JSON.parse(raw)
    return entry && 'data' in entry ? entry : null
  } catch {
    return null
  }
}

export function writeCache(url, params, data) {
  try {
    localStorage.setItem(cacheKey(url, params), JSON.stringify({ data, savedAt: Date.now() }))
    prune()
  } catch {
    // Ignore quota/private-mode failures; cache is an optimization.
  }
}

export function clearCache() {
  try {
    const prefix = `${PREFIX}:${namespace}:`
    storageKeys()
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => localStorage.removeItem(key))
  } catch {
    // Best-effort cleanup.
  }
}
