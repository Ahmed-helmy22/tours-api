const express = require('express');
const viewsController = require('../controller/viewsController');

const router = express.Router();
//root view
router.get('/', viewsController.getOverview);
router.get('/tour/:slug', viewsController.getTour);
router.get('/login', viewsController.getLoginForm);
router.get('/me', viewsController.getProfile);

module.exports = router;
