const express = require('express')
const router = express.Router();
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); 
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid'); 
const JWT_SECRET ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
const nodemailer = require('nodemailer');
const crypto = require('crypto'); 

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
        return res.json({
            status: "FAILED",
            message: "Email is required!"
        });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                status: "FAILED",
                message: "User not found!"
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        user.resetToken = resetToken;
        user.resetTokenExpiration = Date.now() + 3600000;
        await user.save();

        console.log('Reset Token:', resetToken); 
        console.log('Reset Token Expiration:', user.resetTokenExpiration);
        const transporter = nodemailer.createTransport({
            host: 'smtp.office365.com', 
            port: 587,                  
            secure: false,             
            auth: {
                user: 'your_Outlook_address', 
                pass: 'your_password',      
            },
            tls: {
                ciphers: 'SSLv3', 
            },
        });

        const resetLink = `http://localhost:3000/user/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: 'your_Outlook_address',
            to: user.email,
            subject: 'Password Reset',
            text: `You requested a password reset. Click this link to reset your password: ${resetLink}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.json({
                    status: "FAILED",
                    message: "Failed to send email."
                });
            }
            res.json({
                status: "SUCCESS",
                message: "Password reset link sent to your email!"
            });
        });
    } catch (error) {
        console.error(error);
        res.json({
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
        return res.json({
            status: "FAILED",
            message: "Token and new password are required!"
        });
    }

    try {
        const user = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } });
        if (!user) {
            return res.json({
                status: "FAILED",
                message: "Invalid or expired token!"
            });
        }

        const saltRounds = 10;
        user.password = await bcrypt.hash(newPassword, saltRounds);
        user.resetToken = undefined; 
        user.resetTokenExpiration = undefined;
        await user.save();

        res.json({
            status: "SUCCESS",
            message: "Password has been reset successfully!"
        });
    } catch (error) {
        console.error(error);
        res.json({
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
router.post('/signup', async(req, res) => {
    let { username, email, password, company, tel, language } = req.body;

    username = username.trim();
    email = email.trim();
    password = password.trim();
    company = company.trim();
    tel = tel.trim();
    language = language.trim();

    if (username === "" || email === "" || password === "" || tel === "" || language === "" || company === "") {
        return res.json({
            status: "FAILED",
            message: "Empty input fields!"
        });
    }
    if (!/^[a-zA-Z]+$/.test(username)) {
        return res.json({
            status: "FAILED",
            message: "Invalid username entered. Only alphabetic characters are allowed."
        });
    }
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        return res.json({
            status: "FAILED",
            message: "Invalid email entered."
        });
    }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
        return res.json({
            status: "FAILED",
            message: "Password must be at least 8 characters long and contain at least one letter and one number."
        });
    }
    if (!/^[a-zA-Z\s]+$/.test(company)) {
        return res.json({
            status: "FAILED",
            message: "Invalid company name entered. Only letters and spaces are allowed."
        });
    }
    if (!/^\d{10}$/.test(tel)) {
        return res.json({
            status: "FAILED",
            message: "Invalid telephone number. It must be 10 digits."
        });
    }
    const allowedLanguages = ['francais', 'anglais', 'italien'];
    if (!allowedLanguages.includes(language.toLowerCase())) {
        return res.json({
            status: "FAILED",
            message: "Invalid language entered. Allowed values are 'francais', 'anglais', or 'italien'."
        });
    }
    try {
        const existingUser = await User.findOne({ $or: [{ email: email }, { username: username }] });

        if (existingUser) {
            return res.json({
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
            host: 'smtp.office365.com',
            port: 587,
            secure: false,
            auth: {
                user: 'your_outlook_address',
                pass: 'your_outlook_password',
            },
            tls: {
                ciphers: 'SSLv3',
            },
        });

        const mailOptions = {
            from: 'your_outlook_address',
            to: newUser.email,
            subject: 'Account Verification',
            text: `Please verify your account by clicking the link: ${verificationLink}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending verification email:", error);
                return res.json({
                    status: "FAILED",
                    message: "Failed to send verification email."
                });
            }
        });

        res.json({
            status: "SUCCESS",
            message: "Signup successful! Please verify your email."
        });
    } catch (error) {
        console.error(error);
        res.json({
            status: "FAILED",
            message: "An error occurred while processing your request."
        });
    }
});
/**
 * @swagger
 * /user/verify/{token}:
 *   get:
 *     summary: Verify user account
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: The verification token
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account verified successfully
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
router.get('/verify/:token', async (req, res) => {
    const token = req.params.token;

    try {
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpiration: { $gt: Date.now() } 
        });

        if (!user) {
            return res.json({
                status: "FAILED",
                message: "Invalid or expired token!"
            });
        }

        user.isVerified = true; 
        user.verificationToken = undefined; 
        user.verificationTokenExpiration = undefined; 
        await user.save();

        res.json({
            status: "SUCCESS",
            message: "Account verified successfully!"
        });
    } catch (error) {
        console.error(error);
        res.json({
            status: "FAILED",
            message: "An error occurred during verification!"
        });
    }
});

/**
 * @swagger
 * /user/signin:
 *   post:
 *     summary: Sign in an existing user
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User signed in successfully
 *       401:
 *         description: Invalid credentials or user is blocked
 *       500:
 *         description: Internal server error
 */
router.post('/signin', async (req, res) => {
    let { email, password } = req.body;

    email = email.trim();
    password = password.trim();

    if (email === "" || password === "") {
        return res.json({
            status: "FAILED",
            message: "Empty email or password!"
        });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                status: "FAILED",
                message: "Invalid email or password!"
            });
        }

        // Check if the user is blocked
        if (user.blocked) {
            return res.json({
                status: "FAILED",
                message: "User is blocked. Please contact admin for assistance."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({
                status: "FAILED",
                message: "Invalid email or password!"
            });
        }

        // Generate a unique sessionId for each login
        const sessionId = uuidv4(); // Generate a unique session ID
        const issuedAt = Math.floor(Date.now() / 1000); // Timestamp at the time of login

        // Generate a new JWT token for each login
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email, 
                sessionId,   // Include a unique session ID
                iat: issuedAt  // Include the login timestamp
            }, 
            JWT_SECRET,  
            { expiresIn: '1h' }              
        );

        res.json({
            status: "SUCCESS",
            message: "Sign-in successful!!",
            token,
            user: {
                username: user.username,
                email: user.email,
                company: user.company,
                tel: user.tel,
                language: user.language
            }
        });

    } catch (error) {
        console.error(error);
        res.json({
            status: "FAILED",
            message: "An error occurred during sign-in!"
        });
    }
});
module.exports = router;