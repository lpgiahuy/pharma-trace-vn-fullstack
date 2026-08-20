import axios from 'axios'
import toast from 'react-hot-toast'
import { env } from '@/config/env'
import { STORAGE_KEYS } from '@/constants'
import { isTokenExpired } from '@/utils'
import { getPortalKey, getPortalToken, getPortalStorageKeys, setPortalAuth, clearPortalAuth } from '@/utils/portalAuth'

const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Required for the browser to send/receive cookies
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token))
  failedQueue = []
}

apiClient.interceptors.request.use(
  async (config) => {
    const portal = getPortalKey(window.location.pathname)
    const keys = getPortalStorageKeys(portal)
    let accessToken = getPortalToken(portal)

    if (!accessToken) return config

    const refreshToken = localStorage.getItem(keys.REFRESH_TOKEN)
    const shouldRefresh =
      refreshToken &&
      isTokenExpired(accessToken) === false &&
      Date.now() > (Number(localStorage.getItem(keys.TOKEN_EXPIRY)) - env.REFRESH_TOKEN_THRESHOLD)

    if (shouldRefresh && !isRefreshing) {
      isRefreshing = true
      try {
        const { data } = await axios.post(`${env.API_BASE_URL}/auth/refresh`, { refreshToken })
        const newToken = data.data?.token || data.accessToken || data.token
        const newExpiry = data.data?.expiresAt || data.expiresAt || (Date.now() + 3600000)
        
        setPortalAuth(portal, null, newToken, refreshToken, newExpiry)
        config.headers.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
      } catch (err) {
        processQueue(err, null)
        _logout()
      } finally {
        isRefreshing = false
      }
    } else if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response) {
      console.error(
        `[API ${error.response.status}] ${original?.method?.toUpperCase()} ${original?.url}`,
        error.response.data
      )
    }

    const isLoginEndpoint = original?.url?.includes('/login') || original?.url?.includes('/register')

    if (error.response?.status === 401 && !original._retry && !isLoginEndpoint) {
      const portal = getPortalKey(window.location.pathname)
      const keys = getPortalStorageKeys(portal)
      const refreshToken = localStorage.getItem(keys.REFRESH_TOKEN)
      if (!refreshToken) { _logout(); return Promise.reject(error) }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return apiClient(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(`${env.API_BASE_URL}/auth/refresh`, { refreshToken })
        const newToken = data.data?.token || data.accessToken || data.token
        const newExpiry = data.data?.expiresAt || data.expiresAt || (Date.now() + 3600000)
        setPortalAuth(portal, null, newToken, refreshToken, newExpiry)
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch (err) {
        processQueue(err, null)
        _logout()
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.')
    }

    const isAuthEndpoint = original?.url?.includes('/auth/')
    if (error.response?.status >= 500 && !isAuthEndpoint) {
      toast.error('Server error. Please try again later.')
    }

    if (!error.response && !isAuthEndpoint) {
      toast.error('Network error. Please check your connection.')
    }

    return Promise.reject(error)
  }
)

const _logout = () => {
  const portal = getPortalKey(window.location.pathname)
  let redirectUrl = '/login'
  if (portal === 'warehouse') {
    redirectUrl = '/warehouse/login'
  } else if (portal === 'admin') {
    redirectUrl = '/admin/login'
  }
  clearPortalAuth(portal)
  window.location.href = redirectUrl
}

export default apiClient
