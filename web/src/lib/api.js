import axios from 'axios'
import { isCacheable, readCache, writeCache } from './cache'

const configuredUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const configuredOrigin = configuredUrl.endsWith('/api')
  ? configuredUrl.slice(0, -4)
  : configuredUrl

export const API_ORIGIN = configuredOrigin
export const API_BASE_URL = configuredUrl
  ? `${configuredOrigin}/api`
  : '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
})

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sw_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (res) => {
    if (res.config?.method?.toLowerCase() === 'get' && isCacheable(res.config.url)) {
      writeCache(res.config.url, res.config.params, res.data)
    }
    return res
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sw_token')
      window.location.href = '/login'
    }

    const config = err.config
    const canUseCache = !err.response || err.response.status >= 500
    if (canUseCache && config?.method?.toLowerCase() === 'get' && isCacheable(config.url)) {
      const entry = readCache(config.url, config.params)
      if (entry) {
        return {
          data: entry.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: null,
          fromCache: true,
          cachedAt: entry.savedAt,
        }
      }
    }

    return Promise.reject(err)
  }
)

export default api
