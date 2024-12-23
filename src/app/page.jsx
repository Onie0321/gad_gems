"use client";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import GADConnectSimpleLoader from "@/components/loading/simpleLoading";

// Static imports for critical components
import Header from "./homepage/header/page";
import HeroSection from "./homepage/hero-section/page";

// Dynamic imports for other sections
const AboutSection = dynamic(() => import("./homepage/about-section/page"), {
  ssr: true,
});
const RecentEvents = dynamic(() => import("./homepage/event-section/page"), {
  ssr: true,
});
const LatestNews = dynamic(() => import("./homepage/news-section/page"), {
  ssr: true,
});
const FeedbackSection = dynamic(
  () => import("./homepage/feedback-section/page"),
  { ssr: true }
);
const FAQSection = dynamic(() => import("./homepage/faq-section/page"), {
  ssr: true,
});
const Footer = dynamic(() => import("./homepage/footer/page"), { ssr: true });

export default function LandingPage() {
  return (
    <div className="bg-background min-h-screen">
      <main className="flex-grow">
        <Header />
        <Suspense fallback={<GADConnectSimpleLoader />}>
          <HeroSection />
          <AboutSection />
          <RecentEvents />
          <LatestNews />
          <FeedbackSection />
          <FAQSection />
          <Footer />
        </Suspense>
      </main>
    </div>
  );
}
