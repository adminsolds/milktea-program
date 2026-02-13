const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

router.get('/', recommendationController.getRecommendations);
router.get('/:id', recommendationController.getRecommendationById);
router.post('/', recommendationController.createRecommendation);
router.put('/:id', recommendationController.updateRecommendation);
router.delete('/:id', recommendationController.deleteRecommendation);
router.put('/:id/toggle', recommendationController.toggleRecommendationStatus);

module.exports = router;
