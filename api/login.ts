// สิ่งที่ต้องติดตั้งก่อน: npm install pg bcrypt @types/pg @types/bcrypt
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Connection String จะถูกดึงมาจาก Environment Variable ของ Vercel อย่างปลอดภัย
// โค้ดฝั่ง Frontend จะไม่มีทางเห็นค่านี้เด็ดขาด
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // อนุญาตเฉพาะ request แบบ POST เท่านั้น
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // ดึงข้อมูล username และ password จาก body ของ request ที่ส่งมาจาก Frontend
  const { username, password } = req.body;

  // ตรวจสอบข้อมูลเบื้องต้น
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
  }

  try {
    // ดึงรหัสผ่านที่เข้ารหัสไว้ (hash) จากตาราง 'public.users' อย่างปลอดภัย
    const query = 'SELECT password_hash FROM public.users WHERE username = $1';
    const { rows } = await pool.query(query, [username]);

    // กรณีที่ 1: ไม่พบชื่อผู้ใช้นี้ในระบบ
    if (rows.length === 0) {
      // ใช้ข้อความกลางๆ เพื่อป้องกันการเดาชื่อผู้ใช้จากผู้ไม่หวังดี
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const passwordHash = rows[0].password_hash;

    // กรณีที่ 2: เปรียบเทียบรหัสผ่านที่ผู้ใช้ส่งมากับ hash ในฐานข้อมูล
    const isValid = await bcrypt.compare(password, passwordHash);

    if (isValid) {
      // รหัสผ่านถูกต้อง! ล็อกอินสำเร็จ
      // ในแอปจริง อาจจะมีการสร้าง session หรือ JWT Token ต่อจากตรงนี้
      return res.status(200).json({ success: true });
    } else {
      // รหัสผ่านไม่ถูกต้อง
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
}
