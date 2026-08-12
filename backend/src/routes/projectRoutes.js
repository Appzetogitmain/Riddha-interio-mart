const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  updatePhaseStatus,
  updateDeliverable,
  addBudgetItem,
  getProjectHealth,
  generateReport,
  emailReport,
  getProjectAlerts,
  markAlertRead,
  addTeamMember,
  archiveProject,
  downloadReportPDF
} = require('../controllers/projectController');

// Require authentication for all project routes
router.use(protect);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:projectId', getProjectById);
router.put('/:projectId', updateProject);
router.put('/:projectId/phase/:phaseId', updatePhaseStatus);
router.put('/:projectId/deliverable/:deliverableId', updateDeliverable);
router.post('/:projectId/budget', addBudgetItem);
router.get('/:projectId/health', getProjectHealth);
router.post('/:projectId/report', generateReport);
router.post('/:projectId/report/email', emailReport);
router.get('/:projectId/report/download', downloadReportPDF);
router.get('/:projectId/alerts', getProjectAlerts);
router.put('/:projectId/alerts/:alertId', markAlertRead);
router.post('/:projectId/team', addTeamMember);
router.delete('/:projectId', archiveProject);

module.exports = router;
