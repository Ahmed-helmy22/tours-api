const express = require('express');

const router = express.Router();
const toursController = require('../controller/tourController');
const authController = require('../controller/authController');
const reviewRouter = require('./reviewsRoutes');
// allow nested route , if i hit this route then i will be routed to review post-review with req.params
router.use('/:tourId/reviews', reviewRouter);

// ROUTES MIDDLEWARES
router
  .route('/get-top-5')
  .get(toursController.getTop5, toursController.getalltours);
router.route('/getstatics').get(toursController.getStatics);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    toursController.monthlyPlan
  );
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(toursController.getToursWithin);
router.route('/distances/:latlng/unit/:unit').get(toursController.getDistances);
router
  .route('/')
  .get(toursController.getalltours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.createTour
  );

router
  .route('/:id')
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.deleteTour
  )
  .get(toursController.getTour);

module.exports = router;
