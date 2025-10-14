import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './components/Auth/store'
import { LoadingProvider } from './components/shared/LoadingContext.jsx'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <LoadingProvider>
        <Toaster position="top-right" />
        <App />
      </LoadingProvider>
    </Provider>
  </React.StrictMode>,
)
