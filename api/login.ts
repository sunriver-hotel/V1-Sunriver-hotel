// This API endpoint uses plaintext password comparison as per the database schema provided.
// For a production environment, it is highly recommended to store hashed passwords using a library like bcrypt.
import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Connection String will be securely pulled from Vercel's Environment Variables.
// Frontend code will never see this value.
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1, // Suitable for serverless environment
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // Get username and password from the request body sent from the frontend
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    // Securely retrieve the password from the 'public.users' table
    const query = 'SELECT password_hash FROM public.users WHERE username = $1';
    const { rows } = await pool.query(query, [username]);

    // Case 1: Username not found in the system
    if (rows.length === 0) {
      // Use a generic message to prevent username enumeration attacks
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const storedPassword = rows[0].password_hash;

    // Case 2: Compare the submitted password with the one in the database
    // The database is configured to store plaintext passwords, so we perform a direct string comparison.
    const isValid = (password === storedPassword);

    if (isValid) {
      // Correct password! Login successful.
      // In a real application, you might generate a session or JWT token here.
      return res.status(200).json({ success: true });
    } else {
      // Incorrect password
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
