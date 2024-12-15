

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";

export default function FeedbackSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Implement contact form submission logic here
      // For now, we'll just simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Your message has been sent! We'll get back to you soon!");
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="feedback" className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Feedback</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="message">Your Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </div>
          <div>
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Our Office</h3>
              <p>123 Gender Equality Street</p>
              <p>Inclusivity City, IC 12345</p>
              <p>Phone: (123) 456-7890</p>
              <p>
                Email:{" "}
                <a href="mailto:info@gadoffice.gov" className="hover:underline">
                  info@gadoffice.gov
                </a>
              </p>
            </div>
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3917.218497498902!2d121.5740752!3d15.7440445!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3390a6dde33069ab%3A0x6352ac3889b63f4!2sAurora%20State%20College%20of%20Technology%20(ASCOT)%20Main%20Campus%20Administration%20Building!5e0!3m2!1sen!2sph!4v1691580195739"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="ASCOT Main Campus"
              ></iframe>
            </div>
            <div className="mt-4">
              <Image
                src="/logo/pictureascojpg"
                alt="ASCOT Campus"
                width={200}
                height={150}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}





 

