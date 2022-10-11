const Review = require('./../models/Review')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const Bootcamp = require('./../models/Bootcamp')

// @desc     Get all reviews
// @route    GET /api/v1/reviews
// @route    GET /api/v1/bootcamps/:bootcampId/reviews
// @access   Public

exports.getReviews = asyncHandler(async(req, res, next) => {
    if (req.params.bootcampId) {
        const bootcamp = await Bootcamp.findById(req.params.bootcampId)
        if (!bootcamp) {
            return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.bootcampId}`, 404));
        }
        const reviews = await Review.find({ bootcamp: req.params.bootcampId })
        res.status(200).json({ success: true, count: reviews.length, data: reviews })
    } else {
        // query = Course.find().populate('bootcamp')
        res.status(200).json(res.advancedResults)
    }
})

// @desc     Get single reivew
// @route    GET /api/v1/reviews/:id
// @access   Public

exports.getReview = asyncHandler(async(req, res, next) => {
    const review = await Review.findById(req.params.id).populate({
        path: 'bootcamp', select: 'name description'
    })

    if (!review) {
        return new ErrorResponse(`No review found with id of ${req.params.id}`, 404)
    }

    res.status(200).json({
        success: true, data: review
    })
})

// @desc     Add a review
// @route    POST /api/v1/bootcamps/:bootcampId/reviews
// @access   Private

exports.addReview = asyncHandler(async(req, res, next) => {
    req.body.bootcamp = req.params.bootcampId;
    req.body.user = req.user.id;

    const bootcamp = await Bootcamp.findById(req.params.bootcampId)
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.bootcampId}`, 404));
    }

    const review = await Review.create(req.body)

    res.status(201).json({
        success: true, data: review
    })
})

// @desc     Delete a review
// @route    DELETE /api/v1/reviews/:id
// @access   Private

exports.deleteReview = asyncHandler(async(req, res, next) => {

    let review = await Review.findById(req.params.id);
    if (!review) {
        return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
    }
    await review.remove();

    res.status(201).json({
        success: true, data: review
    })
})