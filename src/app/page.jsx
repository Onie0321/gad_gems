"use client";
import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpCircle } from "lucide-react";
import Header from "./homepage/header/page";
import HeroSection from "./homepage/hero-section/page";
import AboutSection from "./homepage/about-section/page";
import RecentEvents from "./homepage/event-section/page";
import NewsSection from "./homepage/news-section/page";
import FeedbackSection from "./homepage/feedback-section/page";
import FAQSection from "./homepage/faq-section/page";
import { getCurrentUser, handleAuthRedirect } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";

// Separator Component
const SectionSeparator = () => (
  <div className="w-full overflow-hidden">
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
    </div>
  </div>
);

export default function LandingPage() {
  const router = useRouter();
  const [isDataReady, setIsDataReady] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        // Check auth status and get redirect info
        const authResult = await handleAuthRedirect();
        setAuthStatus(authResult);

        // If authenticated, mark data as ready
        if (authResult) {
          setIsDataReady(true);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    };

    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleExploreClick = () => {
    if (isDataReady && authStatus?.authenticated) {
      // If data is ready and user is authenticated, redirect to their dashboard
      router.push(authStatus.redirectTo);
    } else {
      // Otherwise, redirect to sign in
      router.push("/sign-in");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="bg-background min-h-screen relative">
      <main className="flex-grow">
        <Header />
        <HeroSection />
        <SectionSeparator />
        <AboutSection />
        <SectionSeparator />
        <RecentEvents />
        <SectionSeparator />
        <NewsSection />
        <SectionSeparator />
        <FeedbackSection />
        <SectionSeparator />
        <FAQSection />
      </main>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-2 rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-700 transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowUpCircle className="w-8 h-8" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
