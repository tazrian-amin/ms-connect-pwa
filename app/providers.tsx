import { BluetoothProvider } from "@/context/bluetooth-provider";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return <BluetoothProvider>{children}</BluetoothProvider>;
}
