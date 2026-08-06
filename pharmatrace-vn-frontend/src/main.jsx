import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { antdTheme } from './config/antdTheme'
import './index.css'
import './i18n'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <HelmetProvider>
        <ConfigProvider theme={antdTheme}>
          <AntApp>
            <App />
          </AntApp>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: { fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: '14px' },
              success: { iconTheme: { primary: '#0b7de8', secondary: '#fff' } },
            }}
          />
        </ConfigProvider>
      </HelmetProvider>
    </BrowserRouter>
  </React.StrictMode>
)
