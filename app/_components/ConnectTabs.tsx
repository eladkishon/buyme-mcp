"use client";

import { useState } from "react";
import { CopyButton } from "./CopyButton";

export function ConnectTabs({
  endpoint,
  copyLabel = "Copy",
  claudeAiComment,
  note,
}: {
  endpoint: string;
  copyLabel?: string;
  claudeAiComment: string;
  note: string;
}) {
  const claudeAi = claudeAiComment
    .split("\n")
    .map((l) => `# ${l}`)
    .join("\n") + `\n${endpoint}`;

  const targets = [
    { key: "gemini", label: "Gemini CLI", cmd: `gemini mcp add --transport http buyme ${endpoint}` },
    { key: "claude-code", label: "Claude Code", cmd: `claude mcp add --transport http buyme ${endpoint}` },
    { key: "claude-ai", label: "Claude.ai", cmd: claudeAi },
  ];
  const [active, setActive] = useState(0);
  const current = targets[active];
  const copyText = current.cmd
    .split("\n")
    .filter((l) => !l.startsWith("#"))
    .join("\n")
    .trim();

  return (
    <div>
      <div className="tabs" role="tablist" aria-label="Connect">
        {targets.map((tgt, i) => (
          <button key={tgt.key} role="tab" aria-selected={i === active} className="tab" onClick={() => setActive(i)}>
            {tgt.label}
          </button>
        ))}
      </div>

      <div className="codeblock">
        <pre><code className="mono">{current.cmd}</code></pre>
        <CopyButton text={copyText} label={copyLabel} />
      </div>

      <p className="code-note">
        {note} <span className="mono" dir="ltr">{endpoint}</span>
      </p>
    </div>
  );
}
