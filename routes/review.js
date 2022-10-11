const express = require('express')
const { getReviews, getReview, addReview, deleteReview } = require("./../controllers/reviews");

const { protect, authorize } = require("./../middleware/auth")

const router = express.Router({ mergeParams: true });

const advancedResults = require("./../middleware/advancedResults")
const Review = require('./../models/Review')

router.route('/').get(
        advancedResults(Review, {
        path: 'bootcamp',
        select: 'name description'
    }), getReviews).post(protect, authorize('user', 'admin'), addReview)

router.route('/:id').get(getReview).delete(deleteReview);

module.exports = router;