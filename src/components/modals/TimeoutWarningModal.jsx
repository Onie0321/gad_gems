"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";

export default function TimeoutWarningModal({
  isOpen,
  onExtendSession,
  onClose,
  onTimeout,
  warningDuration = 60, // Duration in seconds
}) {
  const [countdown, setCountdown] = useState(warningDuration);

  useEffect(() => {
    let timer;
    if (isOpen) {
      setCountdown(warningDuration);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, warningDuration, onTimeout]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-yellow-500" />
            Session Timeout Warning
          </DialogTitle>
          <DialogDescription>
            Your session will expire in {countdown} seconds due to inactivity.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-500">
            Click 'Extend Session' to continue working or 'Logout' to end your
            session now.
          </p>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            Logout
          </Button>
          <Button onClick={onExtendSession} className="bg-blue-500 hover:bg-blue-600">
            Extend Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 