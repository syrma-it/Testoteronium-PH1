import { useEffect, useState } from "react";
import { ConsoleHeader } from "../components/console-header";
import { TicketConsole } from "../components/ticket-console";
import { ShieldPulseIcon } from "../components/icons";

interface DeviceInfo {
  device_id: string;
  hostname: string;
  username: string;
  os_name: string;
  os_version: string;
  connected: boolean;
}

export default function TicketPage() {
  const [device, setDevice] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/device`)
      .then((r) => r.json())
      .then(setDevice)
      .catch(() => null);
  }, []);

  return (
    <main className="relative z-10 mx-auto min-h-screen w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <ConsoleHeader
        title="Support Tickets"
        subtitle="Your open and past requests — scoped to this device."
        deviceName={device?.hostname}
        userName={device?.username}
        osName={device?.os_name}
      />

      <TicketConsole
        deviceId={device?.device_id ?? ""}
        deviceName={device?.hostname ?? "this device"}
        userName={device?.username ?? "You"}
        osName={device?.os_name ?? ""}
      />

      <footer className="mt-16 flex items-center gap-2 border-t border-hair pt-6 text-[11px] text-faint">
        <ShieldPulseIcon className="h-4 w-4 text-teal/60" />
        <span className="font-mono uppercase tracking-[0.18em]">
          Device securely enrolled · reporting to Testosteronium
        </span>
      </footer>
    </main>
  );
}
