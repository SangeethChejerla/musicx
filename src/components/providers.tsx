'use client'

import { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { PlayerProvider } from '@/context/PlayerContext'

export const Providers = ({ children }: { children: ReactNode }) => (
  <PlayerProvider>
    {children}
    <Toaster
      richColors
      position="bottom-right"
      closeButton
      expand={false}
      theme="dark"
    />
  </PlayerProvider>
)