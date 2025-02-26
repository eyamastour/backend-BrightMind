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
const GMAIL_USER = process.env.GMAIL_USER || 'eyamastour22@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || 'rnpi odjb ozmn stzk';

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

        const resetLink = `http://localhost:4200/auth/reset-password/${resetToken}`;
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

// Route to reset password
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ 
            status: "FAILED", 
            message: "New password is required!" 
        });
    }

    try {
        // Find user with valid reset token
        const user = await User.findOne({ 
            resetToken: token,
            resetTokenExpiration: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                status: "FAILED", 
                message: "Invalid or expired reset token!" 
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password and clear reset token
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;
        await user.save();

        res.status(200).json({
            status: "SUCCESS",
            message: "Password reset successfully."
        });
    } catch (error) {
        console.error("Error in reset password:", error);
        res.status(500).json({ 
            status: "FAILED", 
            message: "An error occurred while resetting password." 
        });
    }
});


// Route to render the password reset page
router.get('/reset-password', async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({
            status: "FAILED",
            message: "Token is required!"
        });
    }

    try {
        const user = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } });

        if (!user) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid or expired reset token!"
            });
        }

        // If token is valid, send a response indicating that the user can reset the password
        res.status(200).json({
            status: "SUCCESS",
            message: "Token is valid, you can reset your password now."
        });

        // Alternatively, render a page if you're using a frontend to handle the reset
        // res.render('reset-password', { token });

    } catch (error) {
        console.error("Error in token validation:", error);
        res.status(500).json({
            status: "FAILED",
            message: "An error occurred while validating the reset token."
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
    let { email, password, company, tel, language, firstname, lastname } = req.body;

    // Assurez-vous que les champs existent et ne sont pas vides
    if (!email || !password || !company || !tel || !language || !firstname || !lastname) {
        return res.status(400).json({
            status: "FAILED",
            message: "Empty input fields!"
        });
    }

    // Trim des champs
    email = email.trim();
    firstname = firstname.trim();
    lastname = firstname.trim();
    password = password.trim();
    company = company.trim();
    tel = tel.trim();
    language = language.trim();

    const allowedLanguages = ['francais', 'anglais', 'italien'];
    if (!allowedLanguages.includes(language.toLowerCase())) {
        return res.status(400).json({
            status: "FAILED",
            message: "Invalid language. Allowed values are 'francais', 'anglais', 'italien'."
        });
    }

    try {
        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: "FAILED",
                message: "User with this email already exists!"
            });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            email,
            password: hashedPassword,
            company,
            tel,
            language,
            firstname,
            lastname,
            isVerified: false,
            verificationToken: crypto.randomBytes(32).toString('hex'),
            verificationTokenExpiration: Date.now() + 3600000 // 1 hour
        });
        await newUser.save();

        const verificationLink = `http://localhost:3001/user/verify/${newUser.verificationToken}`;
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASS, // Assurez-vous que GMAIL_PASS est un mot de passe spécifique à l'application si 2FA est activé
            }
        });

        const mailOptions = {
            from: GMAIL_USER,
            to: newUser.email,
            subject: 'Account Verification',
            text: `Please verify your account by clicking the link: ${verificationLink}`,
        };

        // Envoyer l'email et répondre uniquement après son succès
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending verification email:", error);
                return res.status(500).json({
                    status: "FAILED",
                    message: "Failed to send verification email."
                });
            }

            // Répondre après l'envoi de l'email
            res.status(201).json({
                status: "SUCCESS",
                message: "Signup successful! Please verify your email."
            });
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

// Route for verifying account
router.get('/verify/:token', async (req, res) => {
    const { token } = req.params;

    try {
        // Find user with the matching verification token and check expiration
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpiration: { $gt: Date.now() } // Token not expired
        });

        if (!user) {
            return res.status(400).json({
                status: "FAILED",
                message: "Invalid or expired verification token!"
            });
        }

        // Mark the user as verified and clear the token
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiration = undefined;

        await user.save();

        // Redirect to frontend verification success page
        res.redirect('http://localhost:4200/auth/verify-email');
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({
            status: "FAILED",
            message: "An error occurred while verifying the account."
        });
    }
});

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



module.exports = router;
