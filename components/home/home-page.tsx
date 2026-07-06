"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CategoryGrid } from "@/components/home/category-grid";
import { ConnectDeviceModal } from "@/components/home/connect-device-modal";
import { useBluetooth } from "@/context/bluetooth-provider";

export function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { supportMessage, isSupportChecked } = useBluetooth();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Connect Your Device
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Pair Bluetooth devices, monitor live data, and manage connections from
          your browser.
        </p>
      </div>

      {supportMessage && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {supportMessage}
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Device Categories
        </h2>
        <CategoryGrid />
      </section>

      <Button
        size="lg"
        className="w-full sm:w-auto"
        onClick={() => setModalOpen(true)}
        disabled={!isSupportChecked || !!supportMessage}
      >
        Connect Device
      </Button>

      <ConnectDeviceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
