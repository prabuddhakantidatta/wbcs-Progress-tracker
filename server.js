/**
 * WBCS 2026 Prep Tracker - Backend Server
 * 
 * This server connects to MongoDB and provides REST APIs for the frontend.
 * 
 * Setup Instructions:
 * 1. Install Node.js (v18+)
 * 2. Run: npm init -y
 * 3. Run: npm install express mongoose bcryptjs jsonwebtoken cors dotenv
 * 4. Create a .env file with your MongoDB URI and JWT secret
 * 5. Run: node server.js
 */

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// =============================================
// CONFIGURATION
// =============================================
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wbcs_tracker';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.')); // Serve static files from current directory

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// =============================================
// NOTION PROXY (to bypass CORS in browser)
// =============================================
app.post('/api/notion-proxy', async (req, res) => {
    try {
        const path = String(req.query.path || '').replace(/^\//, '');
        if (!path) return res.status(400).json({ message: 'Missing Notion API path' });

        const allowed = ['databases', 'pages', 'databases/query'];
        if (!allowed.some(p => path.startsWith(p))) {
            return res.status(400).json({ message: 'Path not allowed' });
        }

        const notionUrl = `https://api.notion.com/v1/${path}`;
        const notionRes = await fetch(notionUrl, {
            method: 'POST',
            headers: {
                'Authorization': req.headers.authorization || '',
                'Notion-Version': req.headers['notion-version'] || '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body || {})
        });

        const text = await notionRes.text();
        res.status(notionRes.status);
        res.setHeader('Content-Type', notionRes.headers.get('content-type') || 'application/json');
        res.send(text);
    } catch (e) {
        res.status(500).json({ message: 'Notion proxy failed' });
    }
});

// =============================================
// MONGODB SCHEMAS
// =============================================

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date }
});

// User Progress Schema (per user)
const userProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    completedTasks: { type: Map, of: Boolean, default: {} },
    testScores: { type: Map, of: Number, default: {} },

    // per-user rescheduling
    customDates: { type: Map, of: String, default: {} },
    customTestDates: { type: Map, of: String, default: {} },

    // per-user custom tests (do not affect global blueprint)
    customTests: [{
        id: { type: String, required: true },
        number: { type: Number, required: true },
        date: { type: String, required: true },
        type: { type: String, default: 'Mixed' },
        mcqs: { type: Number, default: 75 },
        focus: { type: String, default: '' },
        target: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now }
    }],

    dailyNotes: { type: Map, of: String, default: {} },
    studySessions: [{
        date: Date,
        duration: Number,
        subject: String
    }],
    notes: { type: String, default: '' },
    darkMode: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now }
});

// Subject Schema (shared/admin managed)
const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: String,
    color: { type: String, default: '#667eea' },
    icon: { type: String, default: '📚' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// Task/Blueprint Schema (shared/admin managed)
const taskSchema = new mongoose.Schema({
    date: { type: String, required: true }, // YYYY-MM-DD format
    morning: { type: String, required: true },
    evening: { type: String, default: '' },
    test: { type: String, default: '-' },
    subject: { type: String, required: true },
    hours: { type: Number, default: 3 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Test Schema (shared/admin managed)
const testSchema = new mongoose.Schema({
    number: { type: Number, required: true },
    date: { type: String, required: true },
    type: { type: String, enum: ['Subject', 'Mixed', 'Full', 'Full Mock', 'Final Mock'], default: 'Mixed' },
    mcqs: { type: Number, required: true },
    focus: { type: String, required: true },
    target: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// Routine Schema (shared/admin managed)
const routineSchema = new mongoose.Schema({
    type: { type: String, enum: ['weekday', 'saturday', 'sunday'], required: true },
    schedule: [{
        time: String,
        activity: String,
        details: String,
        duration: String
    }],
    updatedAt: { type: Date, default: Date.now }
});

// Settings Schema (global app settings)
const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now }
});

// Create Models
const User = mongoose.model('User', userSchema);
const UserProgress = mongoose.model('UserProgress', userProgressSchema);
const Subject = mongoose.model('Subject', subjectSchema);
const Task = mongoose.model('Task', taskSchema);
const Test = mongoose.model('Test', testSchema);
const Routine = mongoose.model('Routine', routineSchema);
const Settings = mongoose.model('Settings', settingsSchema);

// =============================================
// AUTH MIDDLEWARE
// =============================================
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// =============================================
// AUTH ROUTES
// =============================================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create user
        const user = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            isAdmin: false
        });
        
        await user.save();
        
        // Create empty progress document
        const progress = new UserProgress({ userId: user._id });
        await progress.save();
        
        // Generate token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
        
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Generate token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
        
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isAdmin: req.user.isAdmin
    });
});

// =============================================
// DATA ROUTES (Get all app data)
// =============================================

// Get all shared data (subjects, tasks, tests, routines)
app.get('/api/data', authMiddleware, async (req, res) => {
    try {
        const subjects = await Subject.find({ isActive: true }).sort('order');
        const tasks = await Task.find({ isActive: true }).sort('date');
        const tests = await Test.find({ isActive: true }).sort('number');
        const routines = await Routine.find();
        
        // Format routines
        const routineMap = { weekday: [], saturday: [], sunday: [] };
        routines.forEach(r => {
            routineMap[r.type] = r.schedule;
        });
        
        res.json({
            subjects: subjects.map(s => s.name),
            tasks: tasks.map(t => ({
                id: t._id.toString(),
                date: t.date,
                morning: t.morning,
                evening: t.evening,
                test: t.test,
                subject: t.subject,
                hours: t.hours
            })),
            tests: tests.map(t => ({
                id: t._id.toString(),
                number: t.number,
                date: t.date,
                type: t.type,
                mcqs: t.mcqs,
                focus: t.focus,
                target: t.target
            })),
            routines: routineMap
        });
    } catch (error) {
        console.error('Get data error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update shared data (admin only)
app.put('/api/data', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { subjects, tasks, tests, routines } = req.body;
        
        // Update subjects
        if (subjects) {
            // Get existing subjects
            const existingSubjects = await Subject.find();
            const existingNames = existingSubjects.map(s => s.name);
            
            // Add new subjects
            for (const name of subjects) {
                if (!existingNames.includes(name)) {
                    await Subject.create({ name, order: subjects.indexOf(name) });
                }
            }
            
            // Deactivate removed subjects
            for (const subject of existingSubjects) {
                if (!subjects.includes(subject.name)) {
                    subject.isActive = false;
                    await subject.save();
                }
            }
        }
        
        // Update tasks
        if (tasks) {
            for (const task of tasks) {
                if (task.id && task.id.match(/^[0-9a-fA-F]{24}$/)) {
                    // Update existing
                    await Task.findByIdAndUpdate(task.id, {
                        date: task.date,
                        morning: task.morning,
                        evening: task.evening,
                        test: task.test,
                        subject: task.subject,
                        hours: task.hours,
                        updatedAt: new Date()
                    });
                } else {
                    // Create new
                    await Task.create({
                        date: task.date,
                        morning: task.morning,
                        evening: task.evening,
                        test: task.test,
                        subject: task.subject,
                        hours: task.hours,
                        createdBy: req.user._id
                    });
                }
            }
        }
        
        // Update tests
        if (tests) {
            for (const test of tests) {
                if (test.id && test.id.match(/^[0-9a-fA-F]{24}$/)) {
                    await Test.findByIdAndUpdate(test.id, test);
                } else {
                    await Test.create(test);
                }
            }
        }
        
        // Update routines
        if (routines) {
            for (const [type, schedule] of Object.entries(routines)) {
                await Routine.findOneAndUpdate(
                    { type },
                    { type, schedule, updatedAt: new Date() },
                    { upsert: true }
                );
            }
        }
        
        res.json({ message: 'Data updated successfully' });
    } catch (error) {
        console.error('Update data error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// =============================================
// USER PROGRESS ROUTES
// =============================================

// Get user progress
app.get('/api/progress', authMiddleware, async (req, res) => {
    try {
        let progress = await UserProgress.findOne({ userId: req.user._id });

        if (!progress) {
            progress = new UserProgress({ userId: req.user._id });
            await progress.save();
        }

        res.json({
            completedTasks: Object.fromEntries(progress.completedTasks || new Map()),
            testScores: Object.fromEntries(progress.testScores || new Map()),

            // per-user rescheduling
            customDates: Object.fromEntries(progress.customDates || new Map()),
            customTestDates: Object.fromEntries(progress.customTestDates || new Map()),

            // per-user custom tests
            customTests: progress.customTests || [],

            dailyNotes: Object.fromEntries(progress.dailyNotes || new Map()),
            studySessions: progress.studySessions || [],
            notes: progress.notes || '',
            darkMode: progress.darkMode || false
        });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user progress
app.put('/api/progress', authMiddleware, async (req, res) => {
    try {
        const {
            completedTasks,
            testScores,
            customDates,
            customTestDates,
            customTests,
            dailyNotes,
            studySessions,
            notes,
            darkMode
        } = req.body;

        let progress = await UserProgress.findOne({ userId: req.user._id });

        if (!progress) {
            progress = new UserProgress({ userId: req.user._id });
        }

        if (completedTasks) progress.completedTasks = new Map(Object.entries(completedTasks));
        if (testScores) progress.testScores = new Map(Object.entries(testScores));
        if (customDates) progress.customDates = new Map(Object.entries(customDates));
        if (customTestDates) progress.customTestDates = new Map(Object.entries(customTestDates));
        if (Array.isArray(customTests)) progress.customTests = customTests;
        if (dailyNotes) progress.dailyNotes = new Map(Object.entries(dailyNotes));
        if (studySessions) progress.studySessions = studySessions;
        if (notes !== undefined) progress.notes = notes;
        if (darkMode !== undefined) progress.darkMode = darkMode;

        progress.updatedAt = new Date();
        await progress.save();

        res.json({ message: 'Progress saved successfully' });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// =============================================
// ADMIN ROUTES
// =============================================

// Get all users (admin only)
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle admin status (admin only)
app.put('/api/admin/users/:id/admin', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.isAdmin = !user.isAdmin;
        await user.save();
        
        res.json({ message: 'Admin status updated', isAdmin: user.isAdmin });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete task (admin only)
app.delete('/api/admin/tasks/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Task.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete test (admin only)
app.delete('/api/admin/tests/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Test.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: 'Test deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// =============================================
// SUBJECTS ROUTES
// =============================================

// Get all subjects
app.get('/api/subjects', authMiddleware, async (req, res) => {
    try {
        const subjects = await Subject.find({ isActive: true }).sort('order');
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create subject (admin only)
app.post('/api/subjects', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name, description, color, icon } = req.body;
        
        const existing = await Subject.findOne({ name });
        if (existing) {
            return res.status(400).json({ message: 'Subject already exists' });
        }
        
        const count = await Subject.countDocuments();
        const subject = new Subject({ name, description, color, icon, order: count });
        await subject.save();
        
        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update subject (admin only)
app.put('/api/subjects/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete subject (admin only)
app.delete('/api/subjects/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Subject.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: 'Subject deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// =============================================
// TASKS ROUTES
// =============================================

// Get all tasks
app.get('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const { month, subject } = req.query;
        let query = { isActive: true };
        
        if (month) {
            query.date = { $regex: `-${month.padStart(2, '0')}-` };
        }
        
        if (subject) {
            query.subject = subject;
        }
        
        const tasks = await Task.find(query).sort('date');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create task
app.post('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const task = new Task({
            ...req.body,
            createdBy: req.user._id
        });
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update task
app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete task
app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
        await Task.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// =============================================
// TESTS ROUTES
// =============================================

// Get all tests
app.get('/api/tests', authMiddleware, async (req, res) => {
    try {
        const tests = await Test.find({ isActive: true }).sort('number');
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create test (admin only)
app.post('/api/tests', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const test = new Test(req.body);
        await test.save();
        res.status(201).json(test);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update test (admin only)
app.put('/api/tests/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(test);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// =============================================
// ROUTINES ROUTES
// =============================================

// Get all routines
app.get('/api/routines', authMiddleware, async (req, res) => {
    try {
        const routines = await Routine.find();
        const result = { weekday: [], saturday: [], sunday: [] };
        routines.forEach(r => {
            result[r.type] = r.schedule;
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update routine (admin only)
app.put('/api/routines/:type', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { type } = req.params;
        const { schedule } = req.body;
        
        const routine = await Routine.findOneAndUpdate(
            { type },
            { type, schedule, updatedAt: new Date() },
            { upsert: true, new: true }
        );
        
        res.json(routine);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// =============================================
// ANALYTICS ROUTES
// =============================================

// Get user analytics
app.get('/api/analytics', authMiddleware, async (req, res) => {
    try {
        const progress = await UserProgress.findOne({ userId: req.user._id });
        const tasks = await Task.find({ isActive: true });
        const tests = await Test.find({ isActive: true });
        
        const completedTasks = progress ? Object.fromEntries(progress.completedTasks || new Map()) : {};
        const testScores = progress ? Object.fromEntries(progress.testScores || new Map()) : {};
        
        // Calculate stats
        const totalTasks = tasks.length;
        const completedCount = Object.values(completedTasks).filter(v => v).length;
        
        // Subject-wise breakdown
        const subjectStats = {};
        tasks.forEach(task => {
            if (!subjectStats[task.subject]) {
                subjectStats[task.subject] = { total: 0, completed: 0, hours: 0 };
            }
            subjectStats[task.subject].total++;
            if (completedTasks[task._id.toString()]) {
                subjectStats[task.subject].completed++;
                subjectStats[task.subject].hours += task.hours || 0;
            }
        });
        
        // Test performance
        const testPerformance = tests.map(test => ({
            number: test.number,
            type: test.type,
            mcqs: test.mcqs,
            score: testScores[test._id.toString()] || null,
            percentage: testScores[test._id.toString()] 
                ? Math.round((testScores[test._id.toString()] / test.mcqs) * 100) 
                : null
        }));
        
        res.json({
            overview: {
                totalTasks,
                completedCount,
                progressPercentage: totalTasks ? Math.round((completedCount / totalTasks) * 100) : 0,
                totalStudyHours: progress?.studySessions?.reduce((sum, s) => sum + s.duration, 0) || 0
            },
            subjectStats,
            testPerformance,
            studySessions: progress?.studySessions || []
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// =============================================
// DATABASE SEEDING (Run once to populate initial data)
// =============================================
async function seedDatabase() {
    try {
        // Check if already seeded
        const subjectCount = await Subject.countDocuments();
        if (subjectCount > 0) {
            console.log('Database already seeded');
            return;
        }
        
        console.log('Seeding database...');
        
        // Seed subjects
        const subjects = ['Polity', 'History', 'Geography', 'Economy', 'Science', 'Environment', 'Current Affairs', 'General'];
        for (let i = 0; i < subjects.length; i++) {
            await Subject.create({ name: subjects[i], order: i });
        }
        
        // Seed routines
        const weekdayRoutine = [
            { time: '05:30 - 06:00', activity: 'Wake Up & Freshen', details: 'Morning routine, light exercise', duration: '30 min' },
            { time: '06:00 - 08:00', activity: 'Morning Study Block', details: 'Theory reading - Primary subject', duration: '2 hrs' },
            { time: '08:00 - 09:00', activity: 'Breakfast & Break', details: 'News reading, current affairs', duration: '1 hr' },
            { time: '09:00 - 18:00', activity: 'Office/Work', details: 'Professional commitments', duration: '9 hrs' },
            { time: '18:00 - 19:00', activity: 'Evening Break', details: 'Rest, snacks, light walk', duration: '1 hr' },
            { time: '19:00 - 21:00', activity: 'Evening Study Block', details: 'MCQ practice, revision', duration: '2 hrs' },
            { time: '21:00 - 22:00', activity: 'Dinner & Relaxation', details: 'Light reading, family time', duration: '1 hr' },
            { time: '22:00 - 22:30', activity: 'Quick Revision', details: 'Day recap, next day planning', duration: '30 min' }
        ];
        
        await Routine.create({ type: 'weekday', schedule: weekdayRoutine });
        await Routine.create({ type: 'saturday', schedule: [
            { time: '06:00 - 08:00', activity: 'Morning Theory', details: 'Subject deep dive', duration: '2 hrs' },
            { time: '08:00 - 09:00', activity: 'Breakfast', details: 'Current affairs reading', duration: '1 hr' },
            { time: '09:00 - 12:00', activity: 'Intensive Study', details: 'Primary subject completion', duration: '3 hrs' },
            { time: '12:00 - 14:00', activity: 'Lunch & Break', details: 'Rest and refresh', duration: '2 hrs' },
            { time: '14:00 - 17:00', activity: 'MCQ Practice', details: 'Subject-wise practice', duration: '3 hrs' },
            { time: '17:00 - 19:00', activity: 'Revision', details: 'Week summary revision', duration: '2 hrs' }
        ]});
        await Routine.create({ type: 'sunday', schedule: [
            { time: '07:00 - 09:00', activity: 'Light Morning Study', details: 'Weak area focus', duration: '2 hrs' },
            { time: '09:00 - 11:00', activity: 'Mock Test', details: 'Weekly assessment', duration: '2 hrs' },
            { time: '11:00 - 13:00', activity: 'Test Analysis', details: 'Error log, learning', duration: '2 hrs' },
            { time: '13:00 - 16:00', activity: 'Break & Lunch', details: 'Complete rest', duration: '3 hrs' },
            { time: '16:00 - 18:00', activity: 'Next Week Planning', details: 'Schedule preparation', duration: '2 hrs' }
        ]});
        
        // Seed tests
        const testsData = [
            { number: 1, date: '2026-01-04', type: 'Subject', mcqs: 50, focus: 'Polity + History', target: 40 },
            { number: 2, date: '2026-01-11', type: 'Subject', mcqs: 50, focus: 'Geography + Economy', target: 40 },
            { number: 3, date: '2026-01-18', type: 'Mixed', mcqs: 75, focus: 'GS Comprehensive', target: 60 },
            { number: 4, date: '2026-01-25', type: 'Mixed', mcqs: 75, focus: 'All Subjects', target: 60 },
            { number: 5, date: '2026-01-31', type: 'Mixed', mcqs: 75, focus: 'Polity Heavy', target: 60 },
            { number: 6, date: '2026-02-01', type: 'Subject', mcqs: 75, focus: 'Environment', target: 60 },
            { number: 7, date: '2026-02-07', type: 'Mixed', mcqs: 75, focus: 'History Focus', target: 60 },
            { number: 8, date: '2026-02-08', type: 'Mixed', mcqs: 75, focus: 'Polity + Geo', target: 60 },
            { number: 9, date: '2026-02-14', type: 'Mixed', mcqs: 75, focus: 'Weak Areas', target: 60 },
            { number: 10, date: '2026-02-15', type: 'Full', mcqs: 100, focus: 'Science Focus', target: 80 },
            { number: 11, date: '2026-02-21', type: 'Full', mcqs: 100, focus: 'Complete GS', target: 80 },
            { number: 12, date: '2026-02-22', type: 'Full', mcqs: 100, focus: 'Current Affairs', target: 80 },
            { number: 13, date: '2026-03-07', type: 'Full Mock', mcqs: 200, focus: 'Exam Simulation', target: 160 },
            { number: 14, date: '2026-03-08', type: 'Full Mock', mcqs: 200, focus: 'Exam Simulation', target: 160 },
            { number: 15, date: '2026-03-14', type: 'Final Mock', mcqs: 200, focus: 'Final Simulation', target: 170 }
        ];
        
        for (const test of testsData) {
            await Test.create(test);
        }
        
        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 12);
        const admin = await User.create({
            name: 'Admin',
            email: 'admin@wbcs.com',
            password: adminPassword,
            isAdmin: true
        });
        await UserProgress.create({ userId: admin._id });
        
        console.log('Database seeded successfully!');
        console.log('Admin credentials: admin@wbcs.com / admin123');
    } catch (error) {
        console.error('Seeding error:', error);
    }
}

// =============================================
// START SERVER
// =============================================
async function startServer() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Seed database if needed
        await seedDatabase();
        
        // Start server
        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`📚 API available at http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
