"use client";

import React, { useState } from "react";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function FeedbackSection() {
  return (
    <section
      id="our-office"
      className="py-24 bg-gradient-to-br from-white via-violet-50/30 to-blue-50/30"
    >
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="w-8 h-8 text-violet-600" />
            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600">
              Our Office
            </h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Visit us at our main campus or reach out through our various
            communication channels.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Contact Information */}
          <div className="order-2 md:order-1 h-[432px]">
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-gray-200/50 transform hover:-translate-y-1 h-full flex items-center justify-center">
              <div className="space-y-12 text-gray-600 w-full max-w-md">
                <div className="flex items-center space-x-6 group">
                  <div className="bg-violet-100 p-4 rounded-xl group-hover:bg-violet-200 transition-colors duration-300">
                    <svg
                      className="w-8 h-8 text-violet-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-center flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                      Address
                    </h3>
                    <p className="text-base">Brgy. Zabali, Baler, Aurora</p>
                    <p className="text-base">Gen Ed, Second Floor</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 group">
                  <div className="bg-violet-100 p-4 rounded-xl group-hover:bg-violet-200 transition-colors duration-300">
                    <svg
                      className="w-8 h-8 text-violet-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div className="text-center flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                      Phone
                    </h3>
                    <p className="text-base">+63 9123456789</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 group">
                  <div className="bg-violet-100 p-4 rounded-xl group-hover:bg-violet-200 transition-colors duration-300">
                    <svg
                      className="w-8 h-8 text-violet-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="text-center flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                      Email
                    </h3>
                    <a
                      href="mailto:gad@ascot.edu.ph"
                      className="text-violet-600 hover:text-violet-700 transition-colors duration-300 text-base"
                    >
                      gad@ascot.edu.ph
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="order-1 md:order-2">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ring-1 ring-gray-200/50 overflow-hidden transform hover:-translate-y-1">
              <div className="rounded-xl overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3917.218497498902!2d121.5740752!3d15.7440445!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3390a6dde33069ab%3A0x6352ac3889b63f4!2sAurora%20State%20College%20of%20Technology%20(ASCOT)%20Main%20Campus%20Administration%20Building!5e0!3m2!1sen!2sph!4v1691580195739"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  className="w-full"
                  title="ASCOT Main Campus"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
