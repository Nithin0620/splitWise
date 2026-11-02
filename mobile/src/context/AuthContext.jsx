import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as SecureStore from 'expo-secure-store'
import api from '../lib/api'
import { connectSocket, disconnectSocket } from '../lib/socket'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
      connectSocket()
    } catch {
      setUser(null)
      await SecureStore.deleteItemAsync('sw_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    SecureStore.getItemAsync('sw_token').then((token) => {
      if (token) fetchMe()
      else setLoading(false)
    })
  }, [fetchMe])

  const login = async (token) => {
    await SecureStore.setItemAsync('sw_token', token)
    await fetchMe()
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    await SecureStore.deleteItemAsync('sw_token')
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
