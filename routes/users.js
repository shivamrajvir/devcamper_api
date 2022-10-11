const express = require('express')

const { protect, authorize } = require("./../middleware/auth")

const { getUser, deleteUser, updateUser, getUsers, createUser } = require('../controllers/users');

const router = express.Router({ mergeParams: true });

const advancedResults = require("./../middleware/advancedResults")
const User = require('./../models/User');

router.use(protect, authorize('admin'))

router.route('/')
    .get(advancedResults(User), getUsers).post(createUser);
router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);

module.exports = router;