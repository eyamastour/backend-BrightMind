const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User'); 
const router = express.Router();


/**
 * @swagger
 * /admin/add-user:
 *   post:
 *     summary: Create a new user
 *     description: Allows admin to create a new user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: JohnDoe
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               company:
 *                 type: string
 *                 example: Company XYZ
 *               tel:
 *                 type: string
 *                 example: 1234567890
 *               language:
 *                 type: string
 *                 enum: [francais, anglais, italien]
 *                 example: francais
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: user
 *     responses:
 *       201:
 *         description: User created successfully.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Internal server error.
 */
router.post('/add-user', async (req, res) => {
    const { username, email, password, company, tel, language, role } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            company,
            tel,
            language,
            role 
        });

        await newUser.save();
        res.status(201).json({ message: 'User created successfully.', user: newUser });
    } catch (err) {
        console.error("Error creating user:", err);  // Log the error in the server
        res.status(500).json({ message: 'Internal server error.', error: err.message || err });
    }
});


/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users.
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                     example: JohnDoe
 *                   email:
 *                     type: string
 *                     example: johndoe@example.com
 *                   company:
 *                     type: string
 *                     example: Company XYZ
 *                   tel:
 *                     type: string
 *                     example: 1234567890
 *                   language:
 *                     type: string
 *                     example: francais
 *                   role:
 *                     type: string
 *                     example: user
 */
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error.' });
    }
});

/**
 * @swagger
 * /admin/user/{id}:
 *   get:
 *     summary: Get a user by ID
 *     description: Retrieve a specific user by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: A user object.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   example: JohnDoe
 *                 email:
 *                   type: string
 *                   example: johndoe@example.com
 *                 company:
 *                   type: string
 *                   example: Company XYZ
 *                 tel:
 *                   type: string
 *                   example: 1234567890
 *                 language:
 *                   type: string
 *                   example: francais
 *                 role:
 *                   type: string
 *                   example: user
 *       404:
 *         description: User not found.
 */
router.get('/user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error.' });
    }
});

/**
 * @swagger
 * /admin/user/{id}:
 *   put:
 *     summary: Update a user by ID
 *     description: Update a specific user's details by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: UpdatedJohnDoe
 *               email:
 *                 type: string
 *                 example: updatedjohndoe@example.com
 *               company:
 *                 type: string
 *                 example: Updated Company XYZ
 *               tel:
 *                 type: string
 *                 example: 9876543210
 *               language:
 *                 type: string
 *                 example: anglais
 *               role:
 *                 type: string
 *                 example: admin
 *     responses:
 *       200:
 *         description: User updated successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.put('/admin/user/:id/role', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role provided.' });
    }

    try {
        const user = await User.findByIdAndUpdate(
            id, 
            { role }, 
            { new: true, runValidators: true } // Ensures schema validation runs
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ 
            message: 'User role updated successfully.', 
            user 
        });
    } catch (err) {
        console.error('Role update error:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

/**
 * @swagger
 * /admin/user/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     description: Remove a specific user from the database.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.delete('/user/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ message: 'User deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
});
/**
 * @swagger
 * /admin/user/{id}/role:
 *   put:
 *     summary: Change a user's role
 *     description: Allows admin to change the role of a specific user by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: admin
 *     responses:
 *       200:
 *         description: User role updated successfully.
 *       404:
 *         description: User not found.
 *       400:
 *         description: Invalid role provided.
 *       500:
 *         description: Internal server error.
 */
router.put('/user/:id/role', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role provided.' });
    }

    try {
        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ message: 'User role updated successfully.', user });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error.' });
    }
});
/**
 * @swagger
 * /admin/block-user/{id}:
 *   put:
 *     summary: Block a user by ID
 *     description: Blocks the user, preventing them from logging in.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID to block
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User blocked successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.put('/block-user/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByIdAndUpdate(
            id,
            { blocked: true },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: 'User blocked successfully.', user });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error.' });
    }
});

/**
 * @swagger
 * /admin/unblock-user/{id}:
 *   put:
 *     summary: Unblock a user by ID
 *     description: Unblocks the user, allowing them to log in again.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID to unblock
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User unblocked successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.put('/unblock-user/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByIdAndUpdate(
            id,
            { blocked: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: 'User unblocked successfully.', user });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error.' });
    }
});
module.exports = router;
