const express = require('express')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: './config/config.env' });

const port = process.env.PORT || 5000

const app = express()

app.listen(() => {
    console.log(`Server is running on ${process.env.NODE_ENV} on port: ${port}`)
})