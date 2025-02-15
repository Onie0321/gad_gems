"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToastContainer } from "react-toastify";

export default function HeroSection() {
  const [showLearnMorePopup, setShowLearnMorePopup] = useState(false);
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      id="home"
      className="relative min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex items-center"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-left space-y-8"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600">
              Welcome To Our Platform
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Empowering change through gender equality and inclusive
              development
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/sign-in">
                <Button className="px-8 py-6 text-lg font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  Explore Events
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="hidden md:block"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-violet-200 to-blue-200 rounded-2xl blur-xl opacity-30"></div>
              <Image
                src="/logo/gadfb.png"
                alt="Hero Image"
                width={400}
                height={400}
                priority
                className="relative w-full h-auto object-cover rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300"
              />
            </div>
          </motion.div>
        </div>
        <LearnMorePopup
          show={showLearnMorePopup}
          onClose={() => setShowLearnMorePopup(false)}
        />
        <ToastContainer position="bottom-right" />
      </div>
    </motion.section>
  );
}

function LearnMorePopup({ show, onClose }) {
  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>What is GADConnect?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            GADConnect is a platform designed for the GAD Office to simplify
            event management and demographic analysis.
          </p>
          <h3 className="text-lg font-semibold">Key Features:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Streamlined event management</li>
            <li>Accurate data collection</li>
            <li>Secure access</li>
            <li>Real-time insights</li>
            <li>Customizable forms</li>
          </ul>
          <h3 className="text-lg font-semibold">Benefits:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Efficient workflows</li>
            <li>Data-driven decisions</li>
            <li>Enhanced privacy</li>
            <li>User-friendly operations</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
