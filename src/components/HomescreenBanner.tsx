import { useState, useEffect } from 'react'

export default function HomescreenBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
    const dismissed = sessionStorage.getItem('hs-banner-dismissed')
    if (!isStandalone && !dismissed) setShow(true)
  }, [])

  if (!show) return null

  return (
    <div className="bg-teal-600 text-white px-4 py-3 flex items-center gap-3 text-sm">
      <div className="flex-1">
        <p className="font-medium">Add to Home Screen for the best experience</p>
        <p className="text-teal-100 text-xs mt-0.5">Tap Share → "Add to Home Screen" to keep your data safe</p>
      </div>
      <button
        onClick={() => { setShow(false); sessionStorage.setItem('hs-banner-dismissed', '1') }}
        className="text-teal-200 font-medium shrink-0 px-2"
      >
        ✕
      </button>
    </div>
  )
}
