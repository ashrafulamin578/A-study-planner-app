import { Router, type IRouter } from "express";
import healthRouter from "./health";
import examRouter from "./exam";
import subjectsRouter from "./subjects";
import topicsRouter from "./topics";
import tasksRouter from "./tasks";
import routineRouter from "./routine";
import notesRouter from "./notes";
import resourcesRouter from "./resources";
import settingsRouter from "./settings";
import progressRouter from "./progress";
import dataRouter from "./data";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/exam", examRouter);
router.use("/subjects", subjectsRouter);
router.use("/topics", topicsRouter);
router.use("/tasks", tasksRouter);
router.use("/routine", routineRouter);
router.use("/notes", notesRouter);
router.use("/resources", resourcesRouter);
router.use("/settings", settingsRouter);
router.use("/progress", progressRouter);
router.use("/data", dataRouter);

export default router;
