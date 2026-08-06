import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import dayjs from 'dayjs'

export const cn = (...inputs) => twMerge(clsx(inputs))

export const formatCurrency = (amount, currency = 'VND') =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount)

export const formatDate = (date, format = 'DD/MM/YYYY') =>
  dayjs(date).format(format)

export const formatDateTime = (date) =>
  dayjs(date).format('DD/MM/YYYY HH:mm')

export const formatRelativeTime = (date) => {
  const diff = dayjs().diff(dayjs(date), 'minute')
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return dayjs(date).format('DD/MM/YYYY')
}

export const truncate = (str, length = 80) =>
  str?.length > length ? str.slice(0, length) + '…' : str

export const slugify = (str) =>
  str?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const capitalize = (str) =>
  str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase()

export const getInitials = (name) =>
  name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'

export const parseError = (error) => {
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.message) return error.message
  return 'An unexpected error occurred'
}

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const debounce = (fn, ms = 300) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), ms)
  }
}

export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const group = item[key]
    acc[group] = acc[group] ? [...acc[group], item] : [item]
    return acc
  }, {})

export const buildQueryString = (params) => {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  )
  return new URLSearchParams(filtered).toString()
}

export const isTokenExpired = (token) => {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]))
    return Date.now() >= exp * 1000
  } catch {
    return true
  }
}

export const getTokenExpiry = (token) => {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]))
    return exp * 1000
  } catch {
    return 0
  }
}

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
  })

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
