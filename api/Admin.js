const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            status: "FAILED",
            message: "Token required"
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                status: "FAILED",
                message: "Invalid or expired token"
            });
        }
        req.user = user; // Attach the decoded user info to the request
        next();
    });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            status: "FAILED",
            message: "Admin privileges required"
        });
    }
    next();
};

// Get all users (admin only)
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            status: "FAILED",
            message: "An error occurred while fetching users"
        });
    }
});

// Update user role (admin only)
router.put('/user/:userId/role', authenticateToken, isAdmin, async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({
            status: "FAILED",
            message: "Valid role is required (user or admin)"
        });
    }

    try {
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                status: "FAILED",
                message: "User not found"
            });
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            status: "SUCCESS",
            message: "User role updated successfully",
            user: {
                _id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            status: "FAILED",
            message: "An error occurred while updating user role"
        });
    }
});

// Update user (admin only)
router.put('/users/:userId', authenticateToken, isAdmin, async (req, res) => {
    const { userId } = req.params;
    const updateData = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!user) {
            return res.status(404).json({
                status: "FAILED",
                message: "User not found"
            });
        }

        res.status(200).json({
            status: "SUCCESS",
            message: "User updated successfully",
            user: {
                _id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            status: "FAILED",
            message: "An error occurred while updating user"
        });
    }
});

module.exports = router;
