"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBluetooth } from "@/context/bluetooth-provider";

export function CommandConsole() {
  const { commandLog, sendCommand, sendGetConfig, clearCommandLog } =
    useBluetooth();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [commandLog]);

  const lastJson = useMemo(() => {
    const lastIn = commandLog.findLast((entry) => entry.direction === "in");
    if (!lastIn) return null;

    try {
      return JSON.stringify(JSON.parse(lastIn.text), null, 2);
    } catch {
      return lastIn.text;
    }
  }, [commandLog]);

  const handleSend = async () => {
    const raw = input.trim();
    if (!raw) {
      setStatus("Enter a command");
      return;
    }

    let commandObj: unknown;
    if (raw.startsWith("{")) {
      try {
        commandObj = JSON.parse(raw);
      } catch {
        setStatus("Invalid JSON");
        return;
      }
    } else {
      commandObj = { cmd: raw };
    }

    setStatus("Sending...");
    await sendCommand(commandObj);
    setStatus(null);
  };

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Send Command
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder='{"cmd":"get_config"} or get_config'
          className="h-11 min-w-40 flex-1 rounded-lg border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <Button onClick={handleSend}>Send</Button>
        <Button variant="secondary" onClick={sendGetConfig}>
          Quick get_config
        </Button>
        <Button variant="ghost" onClick={clearCommandLog}>
          Clear Log
        </Button>
      </div>

      {status && (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {status}
        </p>
      )}

      <div
        ref={logRef}
        className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300"
      >
        {commandLog.length === 0
          ? null
          : commandLog
              .map(
                (entry) =>
                  `${entry.direction === "out" ? "Out ->" : "In <-"} ${entry.text}`,
              )
              .join("\n")}
      </div>

      {lastJson && (
        <>
          <h3 className="mb-2 mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            JSON Viewer
          </h3>
          <pre className="max-h-48 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300">
            {lastJson}
          </pre>
        </>
      )}
    </Card>
  );
}
