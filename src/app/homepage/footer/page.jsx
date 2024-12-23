import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border/40 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#home"
                  className="hover:text-primary transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="#about"
                  className="hover:text-primary transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="#events"
                  className="hover:text-primary transition-colors"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  href="#news"
                  className="hover:text-primary transition-colors"
                >
                  News
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#archived"
                  className="hover:text-primary transition-colors"
                >
                  Archived Content
                </Link>
              </li>
              <li>
                <Link
                  href="#feedback"
                  className="hover:text-primary transition-colors"
                >
                  Feedback
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="hover:text-primary transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <p>Second Floor, General Education Building</p>
            <p>Brgy. Zabali, Baler, Aurora</p>
            <p>Phone: +63 928 503 2000</p>
            <p>Email: ascot.edu.ph</p>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} GAD Office. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
