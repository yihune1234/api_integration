import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import apiKeysRouter from "./api-keys.js";
import keyCheckRouter from "./key-check.js";
import extractRouter from "./extract.js";
import userRouter from "./user.routes.js";
import adminRouter from "./admin.routes.js";
import premiumRouter from "./premium.routes.js";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(apiKeysRouter);
router.use(keyCheckRouter);
router.use(extractRouter);
router.use(userRouter);
router.use(adminRouter);
router.use(premiumRouter);

export default router;
