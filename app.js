const express = require('express');
const cors = require('cors');

require('dotenv').config();

const sequelize = require('./database'); // Import Sequelize connection
const userRoutes = require('./routes/User'); // Import routes

const app = express();
const port = process.env.PORT || 4000;

// Middleware to parse JSON
app.use(express.json());

// Enable CORS
app.use(cors());

// Use routes
app.use('/api/users', userRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

module.exports = sequelize; // Export Sequelize connection
