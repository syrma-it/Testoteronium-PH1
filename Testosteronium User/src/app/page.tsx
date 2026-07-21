import { ConsoleHeader } from "@/components/console-header";
import { HomeCards } from "@/components/home-cards";
import { getDeviceId } from "@/lib/device";
import { getSystemSummary } from "@/lib/sysinfo";
import { ShieldPulseIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const summary = getSystemSummary();
  summary.device_id = getDeviceId();

  return (
    <main className="relative z-10 mx-auto min-h-screen w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <ConsoleHeader
        title="Support Console"
        subtitle="Self-service tools scoped to this device. Open a support ticket and it gets routed straight to your IT team."
        deviceName={summary.hostname}
        userName={summary.username}
        osName={summary.os_name}
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
