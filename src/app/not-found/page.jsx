"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Custom404() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-extrabold text-white mb-2">404</h1>
          <h2 className="text-3xl font-bold text-purple-200 mb-8">
            Page Not Found
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <DisconnectedNetworkSVG />
        </motion.div>

        <motion.p
          className="mt-2 text-lg text-purple-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Oops! The page you're looking for seems to have disconnected from our
          network.
        </motion.p>

        <motion.div
          className="mt-8 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Link
            href="/"
            className="glow-button bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full inline-block transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Return to Homepage
          </Link>
          <Link
            href="/contact"
            className="glow-button bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full inline-block transition-all duration-300 ease-in-out transform hover:scale-105 ml-4"
          >
            Contact Support
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function DisconnectedNetworkSVG() {
  return (
    <svg
      className="mx-auto h-48 w-auto text-purple-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.5}
        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
      />
      <motion.path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12l-2 2m0 0l-2-2m2 2V8"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
    </svg>
  );
}
