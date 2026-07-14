"use client";

import { useMemo, useState } from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useBluetooth } from "@/context/bluetooth-provider";
import {
  CATEGORY_CONFIG_COMMANDS,
  CATEGORY_ECHO_COMMANDS,
} from "@/lib/bluetooth/commands";
import type { DeviceCategoryId } from "@/types/bluetooth";

interface CommandConsoleProps {
  /** The category of the details page this console is rendered on — it
   * decides which command set is shown, independent of connection state. */
  categoryId: DeviceCategoryId;
}

export function CommandConsole({ categoryId }: CommandConsoleProps) {
  const { commandLog, sendCommand, sendGetConfig, clearCommandLog } =
    useBluetooth();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const echoCommands = CATEGORY_ECHO_COMMANDS[categoryId];
  const configCommands = CATEGORY_CONFIG_COMMANDS[categoryId];

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
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          Send Command
        </Typography>

        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          <TextField
            size="small"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder='{"cmd":"get_config"} or get_config'
            sx={{ flex: 1, minWidth: 160 }}
          />
          <Button variant="contained" onClick={handleSend}>
            Send
          </Button>
          <Button variant="outlined" color="secondary" onClick={sendGetConfig}>
            Quick get_config
          </Button>
          <Button variant="text" color="secondary" onClick={clearCommandLog}>
            Clear Log
          </Button>
        </Stack>

        {status && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {status}
          </Typography>
        )}

        {configCommands.length > 0 && (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3 }}>
              Configuration Commands
            </Typography>
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
              Loads a template into the input — adjust the value, then press Send.
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
              {configCommands.map((template) => (
                <Button
                  key={template.label}
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setInput(JSON.stringify(template.command));
                    setStatus(null);
                  }}
                >
                  {template.label}
                </Button>
              ))}
            </Stack>
          </>
        )}

        {echoCommands.length > 0 && (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3 }}>
              Echo Commands
            </Typography>
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
              Sends immediately.
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
              {echoCommands.map((echo) => (
                <Button
                  key={echo.label}
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={() => sendCommand(echo.command)}
                >
                  {echo.label}
                </Button>
              ))}
            </Stack>
          </>
        )}

        {lastJson && (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3, mb: 1 }}>
              JSON Viewer
            </Typography>
            <Typography
              component="pre"
              variant="caption"
              sx={{
                display: "block",
                maxHeight: 192,
                overflow: "auto",
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
                bgcolor: "action.hover",
                p: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              {lastJson}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}
