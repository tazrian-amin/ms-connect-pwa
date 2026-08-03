"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

export type ToastSeverity = "error" | "warning" | "info" | "success";

interface Toast {
  id: number;
  message: string;
  severity: ToastSeverity;
}

interface ToastContextValue {
  /** Queues a message; defaults to an error, which is what most callers want. */
  showToast: (message: string, severity?: ToastSeverity) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Errors stay up longer — they carry the reason a command didn't land. */
const AUTO_HIDE_MS: Record<ToastSeverity, number> = {
  error: 6000,
  warning: 5000,
  info: 4000,
  success: 3000,
};

/**
 * App-wide transient messages, shown one at a time. Its reason for existing is
 * device commands: they fail silently otherwise, since a command that is sent
 * but never confirmed raises nothing the UI could render on its own.
 *
 * Queued rather than replaced, so a burst (six pumps failing at once as the
 * link drops) doesn't collapse into whichever message happened to land last.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Toast[]>([]);
  const nextIdRef = useRef(0);
  const current = queue[0] ?? null;

  const showToast = useCallback(
    (message: string, severity: ToastSeverity = "error") => {
      nextIdRef.current += 1;
      const toast = { id: nextIdRef.current, message, severity };
      setQueue((prev) => [...prev, toast]);
    },
    [],
  );

  // Clickaway is excluded: a toast the user hasn't read shouldn't vanish
  // because they touched the dashboard behind it.
  const dismiss = useCallback((reason?: string) => {
    if (reason === "clickaway") return;
    setQueue((prev) => prev.slice(1));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        // Keyed so a second toast replays the enter transition instead of
        // swapping its text inside the one already on screen.
        key={current?.id}
        open={current !== null}
        autoHideDuration={current ? AUTO_HIDE_MS[current.severity] : null}
        onClose={(_event, reason) => dismiss(reason)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={current?.severity ?? "info"}
          variant="filled"
          onClose={() => dismiss()}
          sx={{ width: "100%" }}
        >
          {current?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
