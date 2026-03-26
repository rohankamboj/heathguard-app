import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { ThemeSync } from '@/components/shared/ThemeSync'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found')
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeSync />
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              '!bg-surface-elevated !text-fg-primary !border !border-line-bright !font-body !text-sm',
            success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--bg-elevated)' } },
            error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--bg-elevated)' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
