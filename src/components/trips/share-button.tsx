"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Link as LinkIcon } from "lucide-react";

interface ShareButtonProps {
  shareToken: string;
}

export function ShareButton({ shareToken }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${shareToken}`
      : `/share/${shareToken}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      await navigator.share({
        title: "TripMind AI 여행 일정",
        text: "AI가 생성한 여행 일정을 확인해보세요!",
        url: shareUrl,
      });
    } else {
      handleCopy();
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <div className="hidden items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--muted)] lg:flex">
        <LinkIcon className="h-3 w-3 shrink-0" />
        <span className="max-w-[180px] truncate">{shareUrl}</span>
      </div>
      <div className="flex gap-2">
        <Button
          variant={copied ? "primary" : "outline"}
          size="sm"
          onClick={handleCopy}
          className="flex-1 sm:flex-none"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              복사됨
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4" />
              링크 복사
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="flex-1 sm:flex-none"
        >
          <Share2 className="h-4 w-4" />
          공유
        </Button>
      </div>
    </div>
  );
}
