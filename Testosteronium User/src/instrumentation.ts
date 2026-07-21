/**
 * Next.js instrumentation — runs once when the production server boots.
 *
 * This is where the silent background check-in is started so it reports this
 * device to the admin console regardless of which page is open. Guarded to the
 * Node.js runtime only (it shells out for serial/disk info).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { startBackgroundCheckin } = await import("./lib/checkin");
  startBackgroundCheckin();
}
