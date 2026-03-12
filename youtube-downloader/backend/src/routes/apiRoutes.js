const express = require("express");
const { analyzeController } = require("../controllers/analyzeController");
const {
  enqueueDownloadController,
  getProgressController,
  getJobController,
  cancelJobController,
  streamFileController,
} = require("../controllers/downloadController");
const { downloadRateLimit, botProtection } = require("../middlewares/security");

const router = express.Router();

router.post("/analyze", botProtection, analyzeController);
router.post(
  "/download",
  botProtection,
  downloadRateLimit,
  enqueueDownloadController,
);
router.get("/progress/:jobId", getProgressController);
router.get("/jobs/:jobId", getJobController);
router.delete("/jobs/:jobId", cancelJobController);
router.get("/file/:jobId", streamFileController);

module.exports = router;
