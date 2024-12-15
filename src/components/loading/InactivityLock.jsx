import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Lock } from 'lucide-react'

const InactivityLock = ({
  isLocked,
  onUnlock,
  inactivityTimeout,
  setInactivityTimeout,
}) => {
  const [pin, setPin] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockEndTime, setBlockEndTime] = useState(null)
  const [error, setError] = useState('')

  const correctPin = '1234' // In a real app, this should be securely stored and validated server-side

  const handlePinSubmit = () => {
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN.')
      return
    }

    if (pin === correctPin) {
      setPin('')
      setAttempts(0)
      setError('')
      onUnlock()
    } else {
      setAttempts(prev => prev + 1)
      setError('Incorrect PIN. Please try again.')
      setPin('')

      if (attempts + 1 >= 5) {
        setIsBlocked(true)
        const endTime = new Date(Date.now() + 1 * 60 * 1000) // 15 minutes from now
        setBlockEndTime(endTime)
      }
    }
  }

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPin(value)
    setError('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && pin.length === 4) {
      handlePinSubmit()
    }
  }

  useEffect(() => {
    if (isBlocked) {
      const timer = setInterval(() => {
        if (blockEndTime && new Date() >= blockEndTime) {
          setIsBlocked(false)
          setBlockEndTime(null)
          setAttempts(0)
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isBlocked, blockEndTime])

  const formatTimeLeft = useCallback(() => {
    if (!blockEndTime) return ''
    const diff = blockEndTime.getTime() - Date.now()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [blockEndTime])

  return (
    <AnimatePresence>
      {isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800"
          >
            <div className="mb-6 flex items-center justify-center">
              <Lock className="h-12 w-12 text-blue-500" />
            </div>
            <h2 className="mb-4 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Locked</h2>
            {isBlocked ? (
              <div className="text-center">
                <p className="mb-4 text-red-500">
                  Too many incorrect attempts. Your account is temporarily blocked.
                </p>
                <p className="text-lg font-semibold">
                  Time remaining: {formatTimeLeft()}
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-center text-gray-600 dark:text-gray-300">
                  Enter your 4-digit PIN to unlock the dashboard.
                </p>
                <div className="mb-4">
                  <Input
                    type="password"
                    placeholder="Enter 4-digit PIN"
                    value={pin}
                    onChange={handlePinChange}
                    onKeyDown={handleKeyDown}
                    maxLength={4}
                    className="text-center text-2xl tracking-widest"
                    aria-label="Enter 4-digit PIN"
                  />
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center justify-center text-red-500"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    {error}
                  </motion.p>
                )}
                <Button 
                  onClick={handlePinSubmit} 
                  className="w-full" 
                  disabled={pin.length !== 4}
                >
                  Unlock
                </Button>
                <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
                  Attempts remaining: {5 - attempts}
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default InactivityLock

