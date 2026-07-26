import { useEffect, useState } from "react";
import { ConsoleHeader } from "../components/console-header";
import { HomeCards } from "../components/home-cards";
import { ShieldPulseIcon } from "../components/icons";

interface DeviceInfo {
  device_id: string;
  hostname: string;
  username: string;
  os_name: string;
  os_version: string;
  connected: boolean;
}

export default function HomePage() {
  const [device, setDevice] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/device`)
      .then((r) => r.json())
      .then(setDevice)
      .catch(() => null);
  }, []);

  return (
    <main className="relative z-10 mx-auto min-h-screen w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <ConsoleHeader
        title="Support Console"
        subtitle="Self-service tools scoped to this device. Open a support ticket and it gets routed straight to your IT team."
        deviceName={device?.hostname}
        userName={device?.username}
        osName={device?.os_name}
      >
        <HomeCards />
      </ConsoleHeader>

      <footer className="mt-16 flex items-center gap-2 border-t border-hair pt-6 text-[11px] text-faint">
        <ShieldPulseIcon className="h-4 w-4 text-teal/60" />
        <span className="font-mono uppercase tracking-[0.18em]">
          Device securely enrolled · reporting to Testosteronium
        </span>
      </footer>
    </main>
  );
}
