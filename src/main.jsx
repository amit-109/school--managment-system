import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import store from './store'
import { LoadingProvider } from './components/shared/LoadingContext.jsx'
import { Toaster } from 'react-hot-toast'
import { ConfirmationProvider } from './components/shared/ConfirmationContext.jsx'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <LoadingProvider>
      <ConfirmationProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            className: 'standard-toast',
            style: {
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 600
            }
          }}
        />
        <App />
      </ConfirmationProvider>
    </LoadingProvider>
  </Provider>,
)
