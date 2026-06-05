"use client";

import { CopyButton } from "./CopyButton";
import { ClaudeMark, GeminiMark } from "./ProviderMarks";

type Provider = "claude" | "gemini";

export function McpCommand({
  endpoint,
  provider,
  t,
}: {
  endpoint: string;
  provider: Provider;
  t: { addTo: string; copy: string };
}) {
  const command = `${provider} mcp add --transport http buyme ${endpoint}`;
  const name = provider === "claude" ? "Claude Code" : "Gemini CLI";

  return (
    <div className="cmd-block">
      <div className="cmd-top">
        <span className="cmd-label">
          {provider === "claude" ? <ClaudeMark size={14} /> : <GeminiMark size={14} />}
          {t.addTo} {name}
        </span>
      </div>
      <div className="cmdline" dir="ltr">
        <span className="cmd-prompt">$</span>
        <code className="cmd-code">{command}</code>
        <CopyButton text={command} label={t.copy} event="copy_mcp_command" eventProps={{ provider }} />
      </div>
    </div>
  );
}
