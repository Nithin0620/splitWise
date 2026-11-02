import { io } from 'socket.io-client'

const socketUrl = (import.meta.env.VITE_SOCKET_URL || '').replace(/\/+$/, '')

const noopSocket = {
  connected: false,
  emit: () => {},
  on: () => {},
  off: () => {},
  connect: () => {},
  disconnect: () => {},
}

let socket = null

export const getSocket = () => {
  if (!socket) {
    if (!socketUrl) {
      socket = noopSocket
    } else {
      const token = localStorage.getItem('sw_token')
      socket = io(socketUrl, {
        auth: { token },
        autoConnect: false,
      })
    }
  }
  return socket
}

export const connectSocket = () => {
  const s = getSocket()
  if (s !== noopSocket && !s.connected) s.connect()
  return s
}

export const disconnectSocket = () => {
  if (socket && socket !== noopSocket && socket.connected) {
    socket.disconnect()
  }
  socket = null
}
