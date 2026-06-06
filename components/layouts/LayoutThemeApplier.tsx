'use client'

import { useEffect } from 'react'

export default function LayoutThemeApplier({ layout }: { layout: string }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-layout', layout)
    return () => {
      document.documentElement.removeAttribute('data-layout')
    }
  }, [layout])
  return null
}
