import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

// Change this to your machine's LAN IP when testing on a physical device
// e.g. 'http://192.168.1.10:5000/api'
// For Expo Go on Android emulator use: 'http://10.0.2.2:5000/api'
export const BASE_URL = __DEV__
  ? 'http://10.0.2.2:5000/api'   // Android emulator → host machine
  : 'https://your-production-api.com/api'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('sw_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('sw_token')
      // AuthContext will detect missing token and redirect to login
    }
    return Promise.reject(err)
  }
)

export default api
