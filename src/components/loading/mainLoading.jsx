"use client";

import { motion } from "framer-motion";

export default function GADConnectLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-transparent">
      <motion.svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        initial="hidden"
        animate="visible"
      >
        {/* Background circle */}
        <motion.circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="rgba(128, 0, 128, 0.2)"
          strokeWidth="8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        {/* Interconnected gender symbols */}
        <motion.path
          d="M100 60 L100 140 M80 80 L120 80 M80 120 L120 120 M60 100 L140 100"
          stroke="#8A2BE2"
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        {/* Orbiting elements */}
        <motion.circle
          cx="100"
          cy="20"
          r="8"
          fill="#00CED1"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        <motion.circle
          cx="180"
          cy="100"
          r="8"
          fill="#00CED1"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
            delay: 1,
          }}
        />
        <motion.circle
          cx="100"
          cy="180"
          r="8"
          fill="#00CED1"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
            delay: 2,
          }}
        />
        <motion.circle
          cx="20"
          cy="100"
          r="8"
          fill="#00CED1"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
            delay: 3,
          }}
        />

        {/* Central spinning icon */}
        <motion.g
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <path
            d="M100 70 L100 130 M85 85 L115 115 M85 115 L115 85"
            stroke="#8A2BE2"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Glowing effect */}
        <motion.circle
          cx="100"
          cy="100"
          r="60"
          fill="none"
          stroke="rgba(0, 206, 209, 0.3)"
          strokeWidth="20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      </motion.svg>
    </div>
  );
}
