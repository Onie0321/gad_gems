"use client";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import GADConnectSimpleLoader from "@/components/loading/simpleLoading";
import Header from "./homepage/header/page";
import HeroSection from "./homepage/hero-section/page";
import AboutSection from "./homepage/about-section/page";
import RecentEvents from "./homepage/event-section/page";
import NewsSection from "./homepage/news-section/page";
import FeedbackSection from "./homepage/feedback-section/page";
import FAQSection from "./homepage/faq-section/page";

export default function LandingPage() {
  return (
    <div className="bg-background min-h-screen">
      <main className="flex-grow">
        <Header />
        <Suspense fallback={<GADConnectSimpleLoader />}>
          <HeroSection />
          <AboutSection />
          <RecentEvents />
          <NewsSection />
          <FeedbackSection />
          <FAQSection />
        </Suspense>
      </main>
    </div>
  );
}
