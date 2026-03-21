const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");

// Map routes to controller functions
router.post("/create-project", projectController.createProject);
router.get("/get-all-project", projectController.getAllProjects);
router.get("/get-project/:id", projectController.getProjectById);
router.put("/update-project/:id", projectController.updateProject);
router.delete("/delete-project/:id", projectController.deleteProject);
router.get(
 "/applications/:project_id",
 projectController.getApplicationsByProject,
);

router.put("/applications/status", projectController.updateApplicationStatus);
module.exports = router;
