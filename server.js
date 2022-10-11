const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan')
const colors = require('colors')
const cookieParser = require('cookie-parser')
const errorHandler = require('./middleware/error')
const fileupload = require('express-fileupload')
const path = require('path')
const mongoSanitize = require("express-mongo-sanitize")
const helmet = require("helmet")
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cors = require('cors')

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Route files
const bootcamps = require('./routes/bootcamps')
const courses = require('./routes/courses')
const auth = require('./routes/auth')
const users = require('./routes/users')
const reviews = require('./routes/review')

// DB files
const connectDB = require('./config/db')
connectDB()

const port = process.env.PORT || 5000

const app = express()

// body parser
app.use(express.json())
    // cookie parser
app.use(cookieParser())

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// File upload
app.use(fileupload())

// SECURITY MIDDLEWARES
// sanitize data
app.use(mongoSanitize())
// set security headers
app.use(helmet())
// to prevent cross site scripting
app.use(xss())
// limit rate, 100 in 10 mins
const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Apply the rate limiting middleware to all requests
app.use(limiter)

// prevent hpp param polution
app.use(hpp());

// enable cors
app.use(cors());

// static public folder
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))

// Mount routers
app.use('/api/v1/bootcamps', bootcamps)
app.use('/api/v1/courses', courses)
app.use('/api/v1/auth', auth)
app.use('/api/v1/users', users)
app.use('/api/v1/reviews', reviews)
    // error handler middleware
app.use(errorHandler)

app.get('/v1', (req, res) => {
    res.send("Hellow world");
});


app.listen(port, () => {
    console.log(`Server is running on ${process.env.NODE_ENV} on port: ${port}`.cyan.bold)
})


process.on('unhandledRejection', (err, promise) => {
    console.log('Error: ' + err.message)
    server.close(() => process.exit(1))
})