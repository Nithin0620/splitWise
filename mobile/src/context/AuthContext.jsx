import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api, { setUnauthenticatedHandler } from '../lib/api'
import { setCacheNamespace, clearCache } from '../lib/cache'
import { connectSocket, disconnectSocket } from '../lib/socket'

const AuthContext = createContext(null)
const CACHED_USER_KEY = 'sw_user'

async function readCachedUser() {
  try {
    const raw = await AsyncStorage.getItem(CACHED_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

async function cacheUser(nextUser) {
  try {
    if (nextUser) await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(nextUser))
    else await AsyncStorage.removeItem(CACHED_USER_KEY)
  } catch {
    // User cache is an offline convenience; ignore storage failures.
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async (allowCache = true) => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
      setCacheNamespace(data.user?._id)
      cacheUser(data.user)
      connectSocket()
    } catch (err) {
      if (err.response?.status === 401) {
        await SecureStore.deleteItemAsync('sw_token')
        await cacheUser(null)
        setCacheNamespace(null)
        setUser(null)
      } else if (allowCache) {
        const cachedUser = await readCachedUser()
        setUser(cachedUser)
        setCacheNamespace(cachedUser?._id)
      } else {
        setUser(null)
        setCacheNamespace(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    SecureStore.getItemAsync('sw_token').then(async (token) => {
      if (!token) {
        setCacheNamespace(null)
        setLoading(false)
        return
      }

      const cachedUser = await readCachedUser()
      if (cachedUser) {
        setUser(cachedUser)
        setCacheNamespace(cachedUser._id)
        setLoading(false)
      }

      fetchMe(true)
    })
  }, [fetchMe])

  // Wire up the axios 401 interceptor so mid-session token expiry clears user state
  useEffect(() => {
    setUnauthenticatedHandler(async () => {
      await clearCache()
      await cacheUser(null)
      setCacheNamespace(null)
      disconnectSocket()
      setUser(null)
    })
    return () => setUnauthenticatedHandler(null)
  }, [])

  const login = async (token) => {
    await cacheUser(null)
    await SecureStore.setItemAsync('sw_token', token)
    await fetchMe(false)
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    await clearCache()
    await cacheUser(null)
    await SecureStore.deleteItemAsync('sw_token')
    setCacheNamespace(null)
    disconnectSocket()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetchUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
