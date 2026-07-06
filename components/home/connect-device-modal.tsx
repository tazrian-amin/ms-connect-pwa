"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CategoryGrid } from "@/components/home/category-grid";
import { DeviceList } from "@/components/device/device-list";
import { useBluetooth } from "@/context/bluetooth-provider";

type ConnectStep = "category" | "scan" | "connect";

export function ConnectDeviceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<ConnectStep>("category");
  const {
    selectedCategory,
    discoveredDevices,
    status,
    error,
    supportMessage,
    isSupportChecked,
    scanForDevices,
    connectDevice,
    clearError,
  } = useBluetooth();

  const handleClose = () => {
    setStep("category");
    clearError();
    onClose();
  };

  const handleCategoryContinue = () => {
    if (selectedCategory) {
      setStep("scan");
    }
  };

  const handleConnect = async (device: BluetoothDevice) => {
    const connected = await connectDevice(device);
    if (connected) {
      handleClose();
      router.push(`/devices/${connected.id}`);
    }
  };

  const stepTitle = {
    category: "Choose Device Category",
    scan: "Scan for Devices",
    connect: "Select a Device",
  }[step];

  return (
    <Modal open={open} onClose={handleClose} title={stepTitle}>
      {supportMessage && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          {supportMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {step === "category" && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Select the type of device you want to connect.
          </p>
          <CategoryGrid selectable />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCategoryContinue}
              disabled={!selectedCategory}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === "scan" && (
        <div className="space-y-4">
          {selectedCategory && (
            <div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Selected category
              </p>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {selectedCategory.icon} {selectedCategory.name}
              </p>
            </div>
          )}

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Tap scan to open the browser device picker. Previously authorized
            devices will also appear in the list below.
          </p>

          <Button
            className="w-full"
            onClick={async () => {
              const success = await scanForDevices();
              if (success) setStep("connect");
            }}
            loading={status === "scanning"}
            disabled={!isSupportChecked || !!supportMessage}
          >
            Scan for Devices
          </Button>

          {discoveredDevices.length > 0 && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setStep("connect")}
            >
              View {discoveredDevices.length} Device
              {discoveredDevices.length !== 1 ? "s" : ""}
            </Button>
          )}

          <div className="flex justify-between gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setStep("category");
                clearError();
              }}
            >
              Back
            </Button>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {step === "connect" && (
        <div className="space-y-4">
          <DeviceList
            devices={discoveredDevices}
            onSelect={handleConnect}
            loading={status === "connecting"}
          />

          <div className="flex justify-between gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setStep("scan");
                clearError();
              }}
            >
              Back
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await scanForDevices();
              }}
              loading={status === "scanning"}
            >
              Scan Again
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
