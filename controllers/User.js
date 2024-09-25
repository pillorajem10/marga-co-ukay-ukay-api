const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ValidationError } = require('sequelize');
const User = require('../models/User'); // Import your User model
const validator = require('validator'); // Import the validator library for email validation

require('dotenv').config();

exports.createUser = async (req, res) => {
    const { email, password, confirmPassword, role } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Email, password, and role are required.' });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }

    // Check if email is already used
    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already in use.' });
        }
    } catch (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: 'Database error.' });
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
    }

    try {
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await User.create({
            email,
            password: hashedPassword, // Store the hashed password
            role,
            verified: false, // Set default value for verified
            verification_token: null, // Initialize verification_token
        });

        res.status(201).json({
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            created_at: newUser.created_at,
            updated_at: newUser.updated_at,
        });
    } catch (err) {
        console.error('Sequelize error:', err);
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.errors.map(e => e.message) });
        }
        res.status(500).json({ error: 'Internal server error.' });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Check if the password matches
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Generate JWT token (optional)
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Send the response with user details and token
        res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                verified: user.verified,
                created_at: user.created_at,
                updated_at: user.updated_at,
                token
            }
        });
    } catch (err) {
        console.error('Sequelize error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
