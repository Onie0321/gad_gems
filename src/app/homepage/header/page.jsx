"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-rose-100 via-violet-100 to-teal-100 border-b border-primary/10 shadow-sm">
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
          <span className="font-bold text-xl text-violet-800">GAD Office</span>
        </Link>

        <div className="flex items-center space-x-6">
          <nav>
            <ul className="flex space-x-1 sm:space-x-2 md:space-x-4">
              {[
                "Home",
                "About",
                "Events",
                "News",
                "Archived",
                "Feedback",
                "FAQ",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href={`#${item.toLowerCase()}`}
                    className="px-2 py-1 rounded-md text-sm font-medium text-violet-700 hover:bg-violet-200/50 hover:text-violet-900 transition-colors duration-200"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center space-x-2">
            <Link href="/sign-in">
              <Button
                variant="outline"
                size="sm"
                className="text-sm font-medium border-violet-400 text-violet-700 hover:bg-violet-200/50 hover:text-violet-900 transition-colors duration-200"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                variant="default"
                size="sm"
                className="text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors duration-200"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
