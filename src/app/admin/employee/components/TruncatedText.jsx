"use client";

import { memo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const TruncatedText = memo(({ text, limit = 30 }) => {
  if (!text) return "";

  const shouldTruncate = text.length > limit;
  const truncatedText = shouldTruncate ? `${text.slice(0, limit)}...` : text;

  if (!shouldTruncate) return <span>{text}</span>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="text-left">
          <span className="block truncate max-w-[200px]">{truncatedText}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px] break-words">
          <p className="text-sm">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

TruncatedText.displayName = "TruncatedText";
