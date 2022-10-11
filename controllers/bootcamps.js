const Bootcamp = require('./../models/Bootcamp')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const geocoder = require('../utils/geocoder')
const path = require('path')
const advancedResults = require('../middleware/advancedResults')

// @desc     Get all bootcamp
// @route    GET /api/v1/bootcamps
// @access   Public
exports.getBootCamps = asyncHandler(async(req, res, next) => {
    // advancedResults
    res.status(200).json(res.advancedResults);
})

// @desc     Get single bootcamp
// @route    GET /api/v1/bootcamps/:id
// @access   Public
exports.getBootCamp = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamps not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
        success: true,
        data: bootcamp
    })
})

// @desc     Create single bootcamp
// @route    POST /api/v1/bootcamps
// @access   Private    // logged in or token
exports.createBootCamp = asyncHandler(async(req, res, next) => {
    // console.log(req.body)
    // res.status(200).json({ success: true, msg: 'Bootcamp added successfully' })
    req.body.user = req.user.id;

    // check for published bootcamp
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id })
        // publisher can add 1, admins can add many
    if (publishedBootcamp && req.user.role !== 'admin') {
        return next(new ErrorResponse(`${req.user.name} is not an admin and has already added a bootcamp`, 400));
    }

    const bootcamp = await Bootcamp.create(req.body)

    res.status(200).json({
        success: true,
        data: bootcamp
    })
})

// @desc     UPDATE bootcamp
// @route    PUT /api/v1/bootcamps/:id
// @access   Private
exports.editBootCamp = asyncHandler(async(req, res, next) => {
    let bootcamp = await Bootcamp.findById(req.params.id)
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamps not found with id of ${req.params.id}`, 404));
    }
    // check if owner is updating bootcamp
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.name} is not authorized to update this bootcamp`, 401));
    }

    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    res.status(200).json({
        success: true,
        data: bootcamp
    })
})

// @desc     DELETE bootcamp
// @route    GET /api/v1/bootcamps/:id
// @access   Private
exports.deleteBootCamp = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamps not found with id of ${req.params.id}`, 404));
    }
    // check if owner is updating bootcamp
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.name} is not authorized to update this bootcamp`, 401));
    }
    bootcamp.remove();
    res.status(200).json({
        success: true,
        data: {}
    })
})

// @desc     GET bootcamps within a radius
// @route    GET /api/v1/bootcamps/radius/:zipcode/:distance (in miles)
// @access   Private
exports.getBootcampsInRadius = asyncHandler(async(req, res, next) => {
    const { zipcode, distance } = req.params;
    // get lat, lng, from geocoder
    const loc = await geocoder.geocode(zipcode)
    const lat = loc[0].latitude,
        lng = loc[0].longitude;
    const radius = distance / 3963;
    const bootcamps = await Bootcamp.find({
        location: {
            $geoWithin: {
                $centerSphere: [
                    [lng, lat], radius
                ]
            }
        }
    })
    res.status(200).json({ success: true, count: bootcamps.length, data: bootcamps })
})

// @desc     Upload photo for bootcamp
// @route    PUT /api/v1/bootcamps/:id
// @access   Private
exports.bootcampPhotoUpload = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamps not found with id of ${req.params.id}`, 404));
    }
    // check if owner is updating bootcamp
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.name} is not authorized to update this bootcamp`, 401));
    }
    if (!req.files) {
        return next(new ErrorResponse(`Please upload a file`, 400));
    }
    const file = req.files.file;
    if (!file.mimetype.startsWith('image/')) {
        return next(new ErrorResponse(`Please upload an image type file`, 400));
    }
    if (file.size > process.env.MAX_FILE_SIZE) {
        return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_SIZE} kb`, 400));
    }

    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async error => {
        if (error) {
            console.error(error);
            return next(new ErrorResponse(`Problem with file upload`, 500));
        }
        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name })
        res.status(200).json({ success: true, data: file.name })
    })
})