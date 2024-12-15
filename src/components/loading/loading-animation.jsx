import React, { useEffect, useState } from 'react'
import { Users, Loader2 } from 'lucide-react'

export const LoadingAnimation = ({
  message = "Loading data, please wait...",
  timeout = 30000,
  onTimeout
}) => {
  const [showTimeout, setShowTimeout] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true)
      if (onTimeout) onTimeout()
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout, onTimeout])

  if (showTimeout) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl text-center">
          <p className="text-red-600 font-semibold">Loading timed out. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl text-center">
        <div className="flex justify-center mb-4">
          <Users className="h-12 w-12 text-blue-600 animate-pulse" />
        </div>
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin mr-2" />
          <p className="text-blue-600 font-semibold">{message}</p>
        </div>
      </div>
    </div>
  )
}

