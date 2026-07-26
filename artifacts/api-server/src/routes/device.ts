import { Router } from "express";
import { getDeviceId } from "../lib/device.js";
import { getSystemSummary } from "../lib/sysinfo.js";

const router = Router();

router.get("/device", (_req, res) => {
  const summary = getSystemSummary();
  res.json({ ...summary, device_id: getDeviceId(), connected: true });
});

export default router;
