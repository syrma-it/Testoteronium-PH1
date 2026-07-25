import { getDeviceId } from "@/lib/device";
import { getSystemSummary } from "@/lib/sysinfo";

export const dynamic = "force-dynamic";

/** Returns this console's device identity + lightweight host context for the UI. */
export async function GET() {
  const summary = getSystemSummary();
  summary.device_id = getDeviceId();
  return Response.json({ ...summary, connected: true });
}
