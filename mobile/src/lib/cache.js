import AsyncStorage from '@react-native-async-storage/async-storage'

const PREFIX = 'sw_cache_v1'
const INDEX_KEY = `${PREFIX}:index`
const MAX_ENTRIES = 120

const CACHEABLE_PATHS = [
  /^\/trips(?:\/|$)/,
  /^\/expenses(?:\/|$)/,
  /^\/settlements(?:\/|$)/,
]

let namespace = 'anon'
let writeQueue = Promise.resolve()

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

export async function readCache(url, params) {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(url, params))
    if (!raw) return null
    const entry = JSON.parse(raw)
    return entry && 'data' in entry ? entry : null
  } catch {
    return null
  }
}

async function persist(key, entry) {
  await AsyncStorage.setItem(key, entry)

  const raw = await AsyncStorage.getItem(INDEX_KEY)
  let index = []
  try {
    index = raw ? JSON.parse(raw) : []
  } catch {
    index = []
  }

  index = index.filter((item) => item && item.key !== key)
  index.push({ key, savedAt: Date.now() })

  const overflow = index.slice(0, Math.max(0, index.length - MAX_ENTRIES))
  if (overflow.length) {
    await AsyncStorage.multiRemove(overflow.map((item) => item.key))
  }

  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index.slice(-MAX_ENTRIES)))
}

export function writeCache(url, params, data) {
  const key = cacheKey(url, params)
  const entry = JSON.stringify({ data, savedAt: Date.now() })
  writeQueue = writeQueue.then(() => persist(key, entry)).catch(() => {})
  return writeQueue
}

export async function clearCache() {
  try {
    const prefix = `${PREFIX}:${namespace}:`
    const keys = await AsyncStorage.getAllKeys()
    const scoped = keys.filter((key) => key.startsWith(prefix))
    if (scoped.length) await AsyncStorage.multiRemove(scoped)
    await AsyncStorage.removeItem(INDEX_KEY)
  } catch {
    // Cache clearing is best-effort; never block logout.
  }
}
