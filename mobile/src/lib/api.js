import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { isCacheable, readCache, writeCache } from './cache'

// Change this to your machine's LAN IP when testing on a physical device
// e.g. 'http://192.168.1.10:5000/api'
// For Expo Go on Android emulator use: 'http://10.0.2.2:5000/api'
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://splitwise.cloud.run/api'

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 })

// Called by AuthContext to hook in a logout handler for mid-session 401s
let onUnauthenticated = null
export const setUnauthenticatedHandler = (handler) => { onUnauthenticated = handler }

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('sw_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => {
    if (res.config?.method?.toLowerCase() === 'get' && isCacheable(res.config.url)) {
      writeCache(res.config.url, res.config.params, res.data)
    }
    return res
  },
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('sw_token')
      // Notify AuthContext to clear user state and redirect to login
      onUnauthenticated?.()
    }

    const config = err.config
    const canUseCache = !err.response || err.response.status >= 500
    if (canUseCache && config?.method?.toLowerCase() === 'get' && isCacheable(config.url)) {
      const entry = await readCache(config.url, config.params)
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
