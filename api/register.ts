// สิ่งที่ต้องติดตั้งก่อน: npm install pg @types/pg
import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Connection String จะถูกดึงมาจาก Environment Variable ของ Vercel อย่างปลอดภัย
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1, // เหมาะสมสำหรับ serverless environment
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // อนุญาตเฉพาะ request แบบ POST เท่านั้น
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { username, password, nickname } = req.body;

  if (!username || !password || !nickname) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const client = await pool.connect();
  try {
    // Check if username already exists
    const existingUser = await client.query('SELECT 1 FROM public.users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'ชื่อผู้ใช้นี้มีอยู่แล้วในระบบ' });
    }

    // Insert new user
    // Storing password as plain text to be consistent with login.ts
    const insertQuery = `
      INSERT INTO public.users (username, password_hash, nickname, user_role, approved_status)
      VALUES ($1, $2, $3, 'Housekeeper', 'not approved')
    `;
    await client.query(insertQuery, [username, password, nickname]);

    return res.status(201).json({ success: true, message: 'ลงทะเบียนสำเร็จ! กรุณารอการอนุมัติจากผู้ดูแลระบบ' });

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการลงทะเบียน:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  } finally {
    client.release();
  }
}
