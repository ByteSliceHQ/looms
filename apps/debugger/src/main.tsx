import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { getRouter } from './router'

import './styles.css'

const root = document.getElementById('root')

if (root) {
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={getRouter()} />
    </StrictMode>,
  )
}
