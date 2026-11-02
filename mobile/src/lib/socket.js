import { io } from 'socket.io-client'
import * as SecureStore from 'expo-secure-store'
import { BASE_URL } from './api'

// Strip /api suffix to get the socket server root
const SOCKET_URL = BASE_URL.replace(/\/api$/, '')

let socket = null

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: false, transports: ['websocket'] })
  }
  return socket
}

export const connectSocket = async () => {
  const s = getSocket()
  const token = await SecureStore.getItemAsync('sw_token')
  if (token) s.auth = { token }
  if (!s.connected) s.connect()
  return s
}

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect()
    socket = null
  }
}
