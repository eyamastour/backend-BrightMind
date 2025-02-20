const mongoose = require('mongoose');
require('dotenv').config();

const Installation = require('../models/installation');
const User = require('../models/User');

async function migrateInstallations() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all users
        const users = await User.find();
        if (users.length === 0) {
            console.log('No users found in the database');
            process.exit(1);
        }

        // Find an admin user to assign installations if needed
        const adminUser = users.find(user => user.role === 'admin');
        if (!adminUser) {
            console.log('No admin user found. Please create an admin user first.');
            process.exit(1);
        }

        // Get all installations without a user field
        const installations = await Installation.find({ user: { $exists: false } });
        console.log(`Found ${installations.length} installations without user assignment`);

        // Update each installation
        for (const installation of installations) {
            await Installation.findByIdAndUpdate(
                installation._id,
                { user: adminUser._id },
                { new: true }
            );
            console.log(`Updated installation: ${installation.name}`);
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateInstallations();
