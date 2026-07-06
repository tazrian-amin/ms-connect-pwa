"use client";

import { useEffect, useRef, useState } from "react";

export function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [applying, setApplying] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const updateRequestedRef = useRef(false);
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // Dev HMR and a caching SW conflict — remove any stale registration.
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });
      return;
    }

    // Only reload in response to a controller change we ourselves triggered by
    // clicking "Update Now" — a bare "clients.claim()" (e.g. on first install)
    // also fires "controllerchange" and would otherwise cause an unwanted reload.
    const onControllerChange = () => {
      if (!updateRequestedRef.current || refreshingRef.current) return;
      refreshingRef.current = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registrationRef.current = registration;

        if (registration.waiting) {
          setUpdateAvailable(true);
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateAvailable(true);
            }
          });
        });

        registration.update().catch(() => undefined);
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  const applyUpdate = () => {
    const waiting = registrationRef.current?.waiting;
    if (!waiting) {
      setUpdateAvailable(false);
      return;
    }

    updateRequestedRef.current = true;
    setApplying(true);
    waiting.postMessage({ type: "SKIP_WAITING" });

    // Safety net: "controllerchange" should fire almost immediately once the
    // new worker claims this page, but if the waiting worker was evicted or
    // the event never arrives, force the reload anyway so the banner never
    // gets stuck on "Applying update...".
    setTimeout(() => {
      if (!refreshingRef.current) {
        refreshingRef.current = true;
        window.location.reload();
      }
    }, 3000);
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit max-w-[90vw] items-center gap-3 rounded-full bg-zinc-900 px-4 py-3 text-white shadow-xl dark:bg-zinc-800">
      <span className="text-sm font-medium">
        {applying ? "Applying update..." : "A new version is available"}
      </span>
      <button
        type="button"
        onClick={applyUpdate}
        disabled={applying}
        className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        Update Now
      </button>
    </div>
  );
}
