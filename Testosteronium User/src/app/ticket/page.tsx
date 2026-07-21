import { ConsoleHeader } from "@/components/console-header";
import { TicketConsole } from "@/components/ticket-console";
import { getDeviceId } from "@/lib/device";
import { getSystemSummary } from "@/lib/sysinfo";

export const dynamic = "force-dynamic";

export default function TicketPage() {
  const summary = getSystemSummary();
  const deviceId = getDeviceId();

  return (
    <main className="relative z-10 mx-auto min-h-screen w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <ConsoleHeader
        title="Support Tickets"
        subtitle="Your requests to IT — open a new one or follow an existing ticket through to resolution. These are scoped to this device only."
        deviceName={summary.hostname}
        userName={summary.username}
        osName={summary.os_name}
      />
      <TicketConsole
        deviceId={deviceId}
        deviceName={summary.hostname}
        userName={summary.username}
        osName={summary.os_name}
      />
    </main>
  );
}
