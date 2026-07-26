import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import deviceRouter from "./device.js";
import ticketsRouter from "./tickets.js";
import assetsRouter from "./assets.js";
import enrollmentRouter from "./enrollment.js";
import agentRouter from "./agent.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(deviceRouter);
router.use(ticketsRouter);
router.use(assetsRouter);
router.use(enrollmentRouter);
router.use(agentRouter);

export default router;
