const User = require('./../models/User')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const crypto = require('crypto')


// get token from model, create cookie and send response
const sendTokenResponse = async(user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }

    res.status(statusCode).cookie('token', token, options).json({ success: true, token })
}

// @desc     Register user
// @route    GET /api/v1/auth/register
// @access   Public
exports.register = asyncHandler(async(req, res, next) => {
    const { name, email, password, role } = req.body;
    const user = await User.create({
        name,
        email,
        password,
        role
    })
    sendTokenResponse(user, 200, res)
})

// @desc     Login user
// @route    GET /api/v1/auth/login
// @access   Public
exports.login = asyncHandler(async(req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorResponse('Please provide email and password', 400))
    }
    // password wont come for select false in model, so we do it manually here
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
        return next(new ErrorResponse('Invalid credentials', 401))
    }
    // check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        return next(new ErrorResponse('Invalid password entered', 401))
    }
    sendTokenResponse(user, 200, res)
})

// @desc     Logout user / clear cookies
// @route    GET /api/v1/auth/logout
// @access   Private
exports.logout = asyncHandler(async(req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), httpOnly: true
    })
    res.status(200).json({ success: true, data: {} });
})

// @desc     get curr user
// @route    GET /api/v1/auth/me
// @access   Private
exports.getMe = asyncHandler(async(req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
})

// @desc     Forgot password
// @route    GET /api/v1/auth/forgotpassword
// @access   Public
exports.forgotPassword = asyncHandler(async(req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new ErrorResponse('No user exists with that email', 404))
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false })
    res.status(200).json({ success: true, data: user, resetToken });
})

// @desc     Reset password
// @route    PUT /api/v1/auth/resetpassword/:resetToken
// @access   Public
exports.resetPassword = asyncHandler(async(req, res, next) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
    console.log(resetPasswordToken)
    const user = await User.findOne({resetPasswordToken, resetPasswordExpire: {$gt: Date.now()}});

    if (!user) {
        return next(new ErrorResponse('Invalid token', 400))
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    sendTokenResponse(user, 200, res)
})

// @desc     Update user details
// @route    PUT /api/v1/auth/updatedetails
// @access   Private
exports.updateDetails = asyncHandler(async(req, res, next) => {
    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true, runValidators: true
    })

    res.status(200).json({
        success: true, data: user
    })
})

// @desc     Update password details
// @route    PUT /api/v1/auth/updatepassword
// @access   Private
exports.updatePassword = asyncHandler(async(req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.matchPassword(req.body.currentPassword))) {
        return next(new ErrorResponse('Incorrent password', 401))
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
})