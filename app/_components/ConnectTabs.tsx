"use client";

import { useState } from "react";
import { CopyButton } from "./CopyButton";

export function ConnectTabs({ endpoint }: { endpoint: string }) {
  const targets = [
    { key: "gemini", label: "Gemini CLI", cmd: `gemini mcp add --transport http buyme ${endpoint}` },
    { key: "claude-code", label: "Claude Code", cmd: `claude mcp add --transport http buyme ${endpoint}` },
    {
      key: "claude-ai",
      label: "Claude.ai",
      cmd: `# Settings -> Connectors -> Add custom connector\n# Paste this URL:\n${endpoint}`,
    },
  ];
  const [active, setActive] = useState(0);
  const current = targets[active];

  return (
    <div>
      <div className="tabs" role="tablist" aria-label="Connect your AI client">
        {targets.map((t, i) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={i === active}
            className="tab"
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="codeblock">
        <pre>
          <code className="mono">{current.cmd}</code>
        </pre>
        <CopyButton text={current.cmd.split("\n").filter((l) => !l.startsWith("#")).join("\n").trim()} />
      </div>

      <p className="code-note">
        Works with any MCP client over Streamable HTTP. For the Gemini API or other SDKs, point their
        MCP transport at <span className="mono" style={{ color: "#ff77a4" }}>{endpoint}</span>.
      </p>
    </div>
  );
}
