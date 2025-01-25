"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-violet-100 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/logo/gad.png"
            alt="GAD Logo"
            width={48}
            height={48}
            className="rounded-full border-2 border-violet-300"
            priority
          />
          <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600">
            GAD Office
          </span>
        </Link>

        <div className="flex items-center space-x-6">
          <nav>
            <ul className="flex space-x-1 sm:space-x-2 md:space-x-4">
              <li>
                {["Home", "About", "Events", "News", "Feedback", "FAQ"].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item.toLowerCase())}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-violet-600 hover:bg-violet-50 transition-colors duration-200"
                  >
                    {item}
                  </button>
                ))}
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
