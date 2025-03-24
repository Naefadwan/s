const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const path = require('path');
const app = express();
const knex = require('knex');
// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5500', // Replace with your frontend URL
  credentials: true
}));
const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

  // Serve static files from public directory
  app.use(express.static(path.join(__dirname, 'public')));
// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});


// --- Authentication Middleware ---
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
}
// Serve login page
app.get('/login', (req, res) => {
  const filePath = path.join(__dirname, 'login.html');
  console.log('Serving file from:', filePath); // Debugging
  res.sendFile(filePath);
});

// Serve register page
app.get('/register', (req, res) => {
  const filePath = path.join(__dirname, 'register.html');
  console.log('Serving file from:', filePath); // Debugging
  res.sendFile(filePath);
});
// --- Routes ---
app.get('/login', (req, res) => {
  const filePath = path.join(__dirname, 'login.html');
  console.log('Serving file from:', filePath); // Debugging
  res.sendFile(filePath);
});
// Register (with validation)
app.post('/register', 
  [
    body('username')
      .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username contains invalid characters'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[!@#$%^&*]/).withMessage('Password must contain a special character')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = await pool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
        [username, hashedPassword]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login (with cookie)
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0 || !await bcrypt.compare(password, result.rows[0].password)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000
    }).json({ message: 'Login successful' });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/prescription', authenticateToken, async (req, res) => {
  try {
    // 1. Get data from the request
    const { symptoms } = req.body;
    const userId = req.user.userId; // From JWT token

    // 2. Validate input
    if (!symptoms) {
      return res.status(400).json({ error: "Symptoms are required" });
    }

    // 3. Call the AI API
    const aiResponse = await axios.post(process.env.AI_API_URL, { symptoms });
    const { medicines, ai_notes } = aiResponse.data;

    // 4. Save to database
    const result = await pool.query(
      'INSERT INTO prescriptions (user_id, medicines, ai_notes) VALUES ($1, $2, $3) RETURNING *',
      [userId, medicines, ai_notes]
    );

    // 5. Return the new prescription
    res.json(result.rows[0]);

  } catch (error) {
    console.error('Prescription error:', error);
    res.status(500).json({ error: "Failed to process prescription" });
  }
});
app.get('/api/medicines', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicines');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching medicines:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order
app.post('/api/checkout', authenticateToken, async (req, res) => {
  const { items } = req.body;
  const userId = req.user.userId;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid order items' });
  }

  try {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderRes = await pool.query(
      'INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING id',
      [userId, total, 'pending']
    );

    const orderId = orderRes.rows[0].id;

    const insertPromises = items.map(item => {
      return pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.id, item.quantity, item.price]
      );
    });

    await Promise.all(insertPromises);
    res.json({ message: 'Order placed', orderId });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Checkout failed' });
  }
});
// Get all orders
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await pool.query(`
      SELECT o.id, u.name, o.total, o.status, o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    res.json(orders.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get all prescriptions
app.get('/api/admin/prescriptions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, pa.name as patient, p.medicines, p.dosage, p.ai_notes, p.created_at
      FROM prescriptions p
      JOIN patients pa ON pa.id = p.patient_id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));