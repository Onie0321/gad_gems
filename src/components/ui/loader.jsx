"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const colors = [
  "#2D89EF", // Blue
  "#4DB6AC", // Teal
  "#FF6F61", // Coral
  "#9C27B0"  // Purple
];

export function ColorfulSpinner({ size = "default", className = "", showText = true }) {
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colors.length);
    }, 1000);

    // Cleanup function will be called when component unmounts
    return () => {
      clearInterval(interval);
      setColorIndex(0); // Reset color index
    };
  }, []);

  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex items-center justify-center">
        <Loader2 
          className={`animate-spin ${sizeClasses[size]} ${className}`}
          style={{ color: colors[colorIndex] }}
        />
      </div>
      {showText && <p className="mt-4 text-sm text-gray-500">Loading...</p>}
    </div>
  );
}

export function ColorfulLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex space-x-2">
        <div className="w-4 h-4 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-4 h-4 rounded-full bg-red-500 animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-4 h-4 rounded-full bg-green-500 animate-bounce"></div>
      </div>
      <p className="mt-4 text-sm text-gray-500">Loading...</p>
    </div>
  );
} 