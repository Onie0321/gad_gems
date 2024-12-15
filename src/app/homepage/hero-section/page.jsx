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
      className="relative p-8 bg-gradient-to-b from-blue-100 to-white"
      style={{ height: "100vh" }}
    >
      <div className="container mx-auto h-full flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-left space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary">
              Welcome To Our Platform
            </h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setShowLearnMorePopup(true)}
                className="px-6 py-3 text-lg font-semibold rounded-md transition-all duration-300 hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Learn More
              </Button>
              <Link href="/sign-in" passHref>
                <Button
                  variant="outline"
                  className="px-6 py-3 text-lg font-semibold rounded-md transition-all duration-300 hover:bg-secondary/90 focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                >
                  Explore events
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <Image
              src="/logo/gadfb.png"
              alt="Hero Image"
              width={500}
              height={500}
              className="w-full h-auto object-cover rounded-lg"
            />
          </div>
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
