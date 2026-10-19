import { Router, type IRouter } from "express";
import healthRouter from "./health";
import billsRouter from "./bills";
import expensesRouter from "./expenses";
import subscriptionsRouter from "./subscriptions";
import assetsRouter from "./assets";
import documentsRouter from "./documents";
import dashboardRouter from "./dashboard";
import aiConversationsRouter from "./aiconversations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(billsRouter);
router.use(expensesRouter);
router.use(subscriptionsRouter);
router.use(assetsRouter);
router.use(documentsRouter);
router.use(dashboardRouter);
router.use(aiConversationsRouter);

export default router;
