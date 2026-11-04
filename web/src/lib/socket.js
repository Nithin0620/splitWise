import Ably from 'ably'
import api from './api'

let client = null
let channel = null
let userChannel = null
let currentTripId = null
let currentUserId = null
const listeners = new Map()

const dispatch = (event, data) => {
  for (const cb of listeners.get(event) || []) cb(data)
}

const getClient = () => {
  if (!client) {
    client = new Ably.Realtime({
      authCallback: async (_tokenParams, callback) => {
        try {
          const { data } = await api.get('/realtime/token')
          callback(null, data)
        } catch (err) {
          callback(err)
        }
      },
    })
  }
  return client
}

const leave = () => {
  channel?.unsubscribe()
  channel = null
  currentTripId = null
}

const leaveUser = () => {
  userChannel?.unsubscribe()
  userChannel = null
  currentUserId = null
}

const joinUser = (userId) => {
  if (!localStorage.getItem('sw_token') || !userId) return

  const id = String(userId)
  if (currentUserId === id && userChannel) return

  leaveUser()
  currentUserId = id
  userChannel = getClient().channels.get(`user:${id}`)
  userChannel.subscribe((message) => dispatch(message.name, message.data))
}

const join = (tripId) => {
  if (!localStorage.getItem('sw_token')) return

  const id = String(tripId)
  if (currentTripId === id && channel) return

  leave()
  currentTripId = id
  channel = getClient().channels.get(`trip:${id}`)
  channel.subscribe((message) => dispatch(message.name, message.data))
}

const socket = {
  get connected() {
    return client?.connection.state === 'connected'
  },

  emit(event, payload) {
    if (event === 'join_trip') return join(payload)
    if (event === 'leave_trip') return leave()
    if (event === 'join_user') return joinUser(payload)
    if (event === 'leave_user') return leaveUser()
  },

  on(event, cb) {
    if (!listeners.has(event)) listeners.set(event, new Set())
    listeners.get(event).add(cb)
  },

  off(event, cb) {
    listeners.get(event)?.delete(cb)
  },

  connect: () => getClient(),

  disconnect() {
    leave()
    leaveUser()
    client?.close()
    client = null
    listeners.clear()
  },
}

export const getSocket = () => socket
export const connectSocket = () => socket
export const disconnectSocket = () => socket.disconnect()
