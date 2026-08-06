export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/v1/pharmatrace',
  APP_NAME:     import.meta.env.VITE_APP_NAME     || 'PharmaTrace VN',
  APP_VERSION:  import.meta.env.VITE_APP_VERSION  || '1.0.0',
  REFRESH_TOKEN_THRESHOLD: Number(import.meta.env.VITE_REFRESH_TOKEN_THRESHOLD) || 300000,
}
