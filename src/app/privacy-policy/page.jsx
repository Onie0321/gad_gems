"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PrivacyPolicy() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  return (
    <Card className="relative max-w-3xl mx-auto shadow-lg rounded-lg overflow-hidden bg-white">
      {/* Back Icon in the Upper Right with Circle Background */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => router.back()}
          className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Go back"
        >
          {/* Using an SVG for the back icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Header Section */}
      <CardHeader className="bg-gradient-to-r from-blue-500 to-teal-500 p-6">
        <div className="grid grid-cols-3 items-center">
          {/* GAD Logo on the Left */}
          <div className="flex justify-center">
            <img
              src="/logo/gad.png" // Replace with actual GAD logo path
              alt="GAD Office Logo"
              className="w-16 h-16 object-contain"
            />
          </div>

          {/* Title and Description */}
          <div className="text-center">
            <CardTitle className="text-3xl font-extrabold text-white">
              Privacy and Policy Statement
            </CardTitle>
            <CardDescription className="text-lg text-gray-200">
              Gender and Development (GAD) Website
            </CardDescription>
          </div>

          {/* ASCOT Logo on the Right */}
          <div className="flex justify-center">
            <img
              src="/logo/ascot.png" // Replace with actual ASCOT logo path
              alt="ASCOT Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>
      </CardHeader>

      {/* Content Section */}
      <CardContent className="space-y-6 p-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Welcome</h2>
          <p>
            Welcome to our Gender and Development web-based system. We are
            committed to protecting your privacy and ensuring a secure and
            respectful experience.
          </p>
        </div>

        {/* Section 1 */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Welcome</h2>
          <p>
            Welcome to our Gender and Development web-based system. We are
            committed to protecting your privacy and ensuring a secure and
            respectful experience.
          </p>
        </div>

        {/* Section 2 */}
        <div>
          <h2 className="text-xl font-semibold mb-2">
            1. Information We Collect
          </h2>
          <p>
            We collect personal identification information such as your name,
            age, gender, and address when you provide it to us. Additionally, we
            collect usage data through cookies, including your IP address,
            browser type, and website interaction details.
          </p>
        </div>

        {/* Section 3 */}
        <div>
          <h2 className="text-xl font-semibold mb-2">
            2. How We Use Your Information
          </h2>
          <p>
            The information we collect is used to enhance the effectiveness of
            our GAD programs, communicate with you, and provide access to our
            services, including policy development and support programs.
          </p>
        </div>

        {/* Section 4 */}
        <div>
          <h2 className="text-xl font-semibold mb-2">
            3. Data Storage and Security
          </h2>
          <p>
            We store your personal information securely in compliance with
            privacy laws. While we take measures to protect your data, no system
            is completely secure, and we cannot guarantee absolute protection.
          </p>
        </div>

        {/* Section 5 */}
        <div>
          <h2 className="text-xl font-semibold mb-2">
            4. Sharing of Information
          </h2>
          <p>
            We will not share your personal information with third parties
            unless we have your consent, are required by law, or need to do so
            for operational reasons in accordance with GAD objectives.
          </p>
        </div>

        {/* Section 6 */}
        <div>
          <h2 className="text-xl font-semibold mb-2">
            5. Cookies and Tracking Technologies
          </h2>
          <p>
            We use cookies and similar tracking technologies to improve your
            experience. You can disable cookies through your browser settings,
            but this may limit certain features of our website.
          </p>
        </div>

        {/* Section 7 */}
        <div>
          <h2 className="text-xl font-semibold mb-2">6. Your Rights</h2>
          <p>
            You have the right to access, correct, or request deletion of your
            data. You can also opt-out of receiving communications. To exercise
            these rights, contact us at [Insert Contact Information].
          </p>
        </div>

        {/* Section 8 */}
        <div>
          <h2 className="text-xl font-semibold mb-2">7. Data Retention</h2>
          <p>
            We retain your data for as long as necessary to fulfill the purposes
            described in this policy. When it is no longer needed, we securely
            dispose of your information.
          </p>
        </div>

        {/* Section 9 */}
        <div>
          <h2 className="text-xl font-semibold mb-2">8. Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites. We are not
            responsible for the privacy practices of these external sites.
            Please review their privacy policies before providing any personal
            information.
          </p>
        </div>

        {/* Section 10 */}
        <div>
          <h2 className="text-xl font-semibold mb-2">
            9. Changes to This Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. Any changes
            will be effective immediately upon posting. Continued use of our
            website after any changes constitutes acceptance of the updated
            policy.
          </p>
        </div>

        {/* Section 11 */}
        <div>
          <h2 className="text-xl font-semibold mb-2">10. Contact Us</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy,
            please contact us at [Insert Contact Information].
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
