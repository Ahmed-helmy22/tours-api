const express = require('express');

const router = express.Router({ mergeParams: true });
const reviewController = require('../controller/reviewController');
const authController = require('../controller/authController');

// /tours/445454/review allow mergeParams
// /reviews
router.use(authController.protect);
router
  .route('/')
  .post(
    authController.restrictTo('user'),
    reviewController.setIdValues,
    reviewController.addReview
  )
  .get(authController.protect, reviewController.getAllReviews);
router
  .route('/:id')
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.checkUserOrAdmin,
    reviewController.deleteReview
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.checkUserOrAdmin,
    reviewController.updateReview
  )
  .get(reviewController.getReview);
module.exports = router;
