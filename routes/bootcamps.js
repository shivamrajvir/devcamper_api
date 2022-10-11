const express = require('express')


const { getBootCamps, getBootCamp, createBootCamp, editBootCamp, deleteBootCamp, getBootcampsInRadius, bootcampPhotoUpload } = require("./../controllers/bootcamps");

const advancedResults = require("./../middleware/advancedResults")
const Bootcamp = require('./../models/Bootcamp')

// include other resource routers
const courseRouter = require('./courses')
const reviewRouter = require('./review')

const { protect, authorize } = require("./../middleware/auth")

const router = express.Router();

// Re-route to other resource routers
router.use('/:bootcampId/courses', courseRouter)
// Re-route to other resource routers
router.use('/:bootcampId/reviews', reviewRouter)

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

router.route('/:id/photo').put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload);

router.route('/').get(advancedResults(Bootcamp, 'courses'), getBootCamps).post(protect, authorize('publisher', 'admin'), createBootCamp);

router.route('/:id').get(getBootCamp).put(protect, authorize('publisher', 'admin'), editBootCamp).delete(protect, authorize('publisher', 'admin'), deleteBootCamp);

module.exports = router;