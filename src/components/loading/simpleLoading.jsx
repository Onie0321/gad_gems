"use client"

import { motion } from "framer-motion"

export default function GADConnectSimpleLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-gray-800 bg-opacity-50 backdrop-blur-sm"></div>
      <motion.div
        className="relative w-16 h-16 mb-4"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            borderWidth: "4px",
            borderStyle: "solid",
            borderImage: "linear-gradient(to right, #6A0DAD, #008080) 1",
            opacity: 0.7,
          }}
          animate={{
            opacity: [0.7, 1, 0.7],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            borderWidth: "4px",
            borderStyle: "solid",
            borderImage: "linear-gradient(to left, #6A0DAD, #008080) 1",
            opacity: 0.5,
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1.1, 1, 1.1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
      <motion.p
        className="text-white text-lg font-semibold relative z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Loading GADConnect...
      </motion.p>
      <span className="sr-only">Loading GADConnect</span>
    </div>
  )
}

