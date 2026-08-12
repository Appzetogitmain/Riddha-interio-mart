const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification,
  getUserPreferences,
  updateUserPreferences,
  createCampaign,
  getCampaignById,
  dispatchCampaign,
  getNotificationAnalytics,
  generatePersonalizedMessage,
  getOptimalSendTime
} = require('../controllers/notificationCenterController');

router.use(protect);

router.post('/send', sendNotification);
router.get('/user', getUserNotifications);
router.put('/preferences', updateUserPreferences);
router.get('/preferences', getUserPreferences);

router.post('/campaign', createCampaign);
router.get('/campaign/:campaignId', getCampaignById);
router.post('/campaign/:campaignId/send', dispatchCampaign);
router.get('/analytics/dashboard', getNotificationAnalytics);

router.post('/generate-message', generatePersonalizedMessage);
router.post('/optimal-send-time', getOptimalSendTime);

router.put('/:notificationId', markAsRead);
router.delete('/:notificationId', deleteNotification);

module.exports = router;
