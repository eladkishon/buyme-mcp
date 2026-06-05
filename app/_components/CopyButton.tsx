"use client";

import { useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button className={`copy${copied ? " copied" : ""}`} onClick={onCopy} aria-label={label}>
      {copied ? <Check size={15} weight="bold" /> : <Copy size={15} />}
      {copied ? "Copied" : label}
    </button>
  );
}
