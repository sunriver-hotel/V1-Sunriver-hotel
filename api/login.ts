// สิ่งที่ต้องติดตั้งก่อน: npm install pg @types/pg
import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Connection String จะถูกดึงมาจาก Environment Variable ของ Vercel อย่างปลอดภัย
// โค้ดฝั่ง Frontend จะไม่มีทางเห็นค่านี้เด็ดขาด
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

  // ดึงข้อมูล username และ password จาก body ของ request ที่ส่งมาจาก Frontend
  const { username, password } = req.body;

  // เพิ่มบัญชีผู้ใช้ชั่วคราวสำหรับ Preview ซึ่งจะทำงานเฉพาะในสภาพแวดล้อมที่ไม่ใช่ Production
  // Vercel จะตั้งค่า VERCEL_ENV เป็น 'production', 'preview', หรือ 'development'
  if (process.env.VERCEL_ENV !== 'production' && username === 'preview' && password === 'preview123') {
    console.log('Preview user login successful.');
    return res.status(200).json({ success: true });
  }

  // ตรวจสอบข้อมูลเบื้องต้น
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
  }

  try {
    // ดึงรหัสผ่านจากตาราง 'public.users' อย่างปลอดภัย
    const query = 'SELECT password_hash FROM public.users WHERE username = $1';
    const { rows } = await pool.query(query, [username]);

    // กรณีที่ 1: ไม่พบชื่อผู้ใช้นี้ในระบบ
    if (rows.length === 0) {
      // ใช้ข้อความกลางๆ เพื่อป้องกันการเดาชื่อผู้ใช้จากผู้ไม่หวังดี
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const passwordInDb = rows[0].password_hash;

    // กรณีที่ 2: เปรียบเทียบรหัสผ่านที่ผู้ใช้ส่งมากับรหัสผ่านในฐานข้อมูล (ซึ่งเป็น Plain text)
    // เพิ่ม .trim() เพื่อตัดช่องว่างที่อาจเกิดขึ้นโดยไม่ตั้งใจ
    const isValid = password.trim() === passwordInDb.trim();

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
