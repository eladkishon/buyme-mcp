"use client";

import { useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";

export function CopyButton({
  text,
  label = "Copy",
  variant = "solid",
}: {
  text: string;
  label?: string;
  variant?: "solid" | "chip";
}) {
  const [copied, setCopied] = useState(false);
  const base = variant === "chip" ? "chip-copy" : "copy";

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
    <button className={`${base}${copied ? " copied" : ""}`} onClick={onCopy} aria-label={label}>
      {copied ? <Check size={15} weight="bold" /> : <Copy size={15} />}
      {copied ? (variant === "chip" ? label : "Copied") : label}
    </button>
  );
}
