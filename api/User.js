const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config(); // Pour utiliser des variables d'environnement

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key'; // Stocker dans une variable d'environnement
const GMAIL_USER = process.env.GMAIL_USER || 'votre-email@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || 'votre-mot-de-passe';

/**
 * @swagger
 * /user/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset link sent
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            status: "FAILED",
            message: "Email is required!"
        });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                status: "FAILED",
                message: "User not found!"
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiration = Date.now() + 3600000; // 1 heure
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER, // Utilisation des variables d'environnement
                pass: GMAIL_PASS,
            }
        });

        const resetLink = `http://localhost:3000/user/reset-password?token=${resetToken}`;
        const mailOptions = {
            from: GMAIL_USER,
            to: user.email,
            subject: 'Password Reset',
            text: `You requested a password reset. Click this link to reset your password: ${resetLink}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).json({
                    status: "FAILED",
                    message: "Failed to send email."
                });
            }
            res.status(200).json({
                status: "SUCCESS",
                message: "Password reset link sent to your email!"
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "FAILED",
            message: "An error occurred while processing your request."
        });
    }
});

/**
 * @swagger
 * /user/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token or password
 *       500:
 *         description: Internal server error
 */
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({
            status: "FAILED",
            message: "Token and new password are required!"
        });
    }

    try {
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiration: { $gt: Date.now() } 
        });
        if (!user) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid or expired token!"
            });
        }

        const saltRounds = 10;
        user.password = await bcrypt.hash(newPassword, saltRounds);
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;
        await user.save();

        res.status(200).json({
            status: "SUCCESS",
            message: "Password has been reset successfully!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "FAILED",
            message: "An error occurred while resetting the password."
        });
    }
});

/**
 * @swagger
 * /user/signup:
 *   post:
 *     summary: Create a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               company:
 *                 type: string
 *               tel:
 *                 type: string
 *               language:
 *                 type: string
 *                 enum: [francais, anglais, italien]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/signup', async (req, res) => {
    let { username, email, password, company, tel, language } = req.body;

    username = username.trim();
    email = email.trim();
    password = password.trim();
    company = company.trim();
    tel = tel.trim();
    language = language.trim();

    if (!username || !email || !password || !company || !tel || !language) {
        return res.status(400).json({
            status: "FAILED",
            message: "Empty input fields!"
        });
    }

    const allowedLanguages = ['francais', 'anglais', 'italien'];
    if (!allowedLanguages.includes(language.toLowerCase())) {
        return res.status(400).json({
            status: "FAILED",
            message: "Invalid language. Allowed values are 'francais', 'anglais', 'italien'."
        });
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({
                status: "FAILED",
                message: "User with this email or username already exists!"
            });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            company,
            tel,
            language,
            isVerified: false,
            verificationToken: crypto.randomBytes(32).toString('hex'),
            verificationTokenExpiration: Date.now() + 3600000 
        });

        await newUser.save();

        const verificationLink = `http://localhost:3000/user/verify/${newUser.verificationToken}`;
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASS,
            }
        });

        const mailOptions = {
            from: GMAIL_USER,
            to: newUser.email,
            subject: 'Account Verification',
            text: `Please verify your account by clicking the link: ${verificationLink}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending verification email:", error);
                return res.status(500).json({
                    status: "FAILED",
                    message: "Failed to send verification email."
                });
            }
        });

        res.status(201).json({
            status: "SUCCESS",
            message: "Signup successful! Please verify your email."
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "FAILED",
            message: "An error occurred during signup."
        });
    }
});


router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            status: "FAILED",
            message: "Email and password are required!"
        });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                status: "FAILED",
                message: "User not found!"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                status: "FAILED",
                message: "Invalid credentials!"
            });
        }

        // Create a JWT token and include the role
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        
        res.status(200).json({
            status: "SUCCESS",
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role, // Include the role in the response
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            status: "FAILED",
            message: "An error occurred during login."
        });
    }
});

/**
 * @swagger
 * /user/logout:
 *   post:
 *     summary: Log out the user
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       500:
 *         description: Internal server error
 */
router.post('/logout', (req, res) => {
    try {
        // Pour la déconnexion, on n'a rien à faire côté serveur avec le JWT,
        // car celui-ci est stocké côté client (ex: localStorage, cookies, etc.)
        
        // Ici, tu peux juste envoyer une réponse au client pour lui indiquer qu'il doit supprimer le token localement.
        res.status(200).json({
            status: "SUCCESS",
            message: "Logged out successfully. Please remove the token from your client storage."
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "FAILED",
            message: "An error occurred while logging out."
        });
    }
});


module.exports = router;
