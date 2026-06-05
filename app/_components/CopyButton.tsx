"use client";

import { useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";
import { track } from "@vercel/analytics";

type Variant = "solid" | "chip" | "primary";

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel,
  variant = "solid",
  event,
  eventProps,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  variant?: Variant;
  event?: string;
  eventProps?: Record<string, string | number | boolean | null>;
}) {
  const [copied, setCopied] = useState(false);

  const base =
    variant === "chip" ? "chip-copy" : variant === "primary" ? "btn btn-primary" : "copy";
  const iconSize = variant === "primary" ? 17 : 15;

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (event) track(event, eventProps);
      setTimeout(() => setCopied(false), 1700);
    } catch {
      /* clipboard unavailable */
    }
  }

  // What to show once copied. Chips keep their own label; solid/primary fall back to a generic confirm.
  const doneLabel = copiedLabel ?? (variant === "chip" ? label : "Copied");

  return (
    <button
      className={`${base}${copied ? " copied" : ""}`}
      onClick={onCopy}
      aria-label={label}
      type="button"
    >
      {copied ? <Check size={iconSize} weight="bold" /> : <Copy size={iconSize} />}
      {copied ? doneLabel : label}
    </button>
  );
}
