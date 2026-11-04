import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import { setCacheNamespace, clearCache } from '../lib/cache'
import { connectSocket, disconnectSocket } from '../lib/socket'

const AuthContext = createContext(null)
const CACHED_USER_KEY = 'sw_user'

function readCachedUser() {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function cacheUser(nextUser) {
  try {
    if (nextUser) localStorage.setItem(CACHED_USER_KEY, JSON.stringify(nextUser))
    else localStorage.removeItem(CACHED_USER_KEY)
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
        localStorage.removeItem('sw_token')
        cacheUser(null)
        setCacheNamespace(null)
        setUser(null)
      } else if (allowCache) {
        const cachedUser = readCachedUser()
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
    const token = localStorage.getItem('sw_token')
    if (!token) {
      setCacheNamespace(null)
      setLoading(false)
      return
    }

    const cachedUser = readCachedUser()
    if (cachedUser) {
      setUser(cachedUser)
      setCacheNamespace(cachedUser._id)
      setLoading(false)
    }

    fetchMe(true)
  }, [fetchMe])

  const login = (token) => {
    cacheUser(null)
    localStorage.setItem('sw_token', token)
    return fetchMe(false)
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    await clearCache()
    cacheUser(null)
    localStorage.removeItem('sw_token')
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
