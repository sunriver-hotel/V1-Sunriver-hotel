import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1,
});

const getStatuses = async (req: VercelRequest, res: VercelResponse) => {
    const client = await pool.connect();
    try {
        // --- STEP 1: ทำให้ระบบเสถียร (ROBUSTNESS) ---
        // ใช้ LEFT JOIN เพื่อรับประกันว่าได้ข้อมูลครบทุกห้อง
        // และสร้างข้อมูลสถานะเริ่มต้นสำหรับห้องที่ยังไม่มีข้อมูลไปพร้อมกัน
        const ensureAndFetchQuery = `
            WITH ensured_statuses AS (
                INSERT INTO public.cleaning_statuses (room_id, status)
                SELECT r.room_id, 'Clean' FROM public.rooms r
                ON CONFLICT (room_id) DO NOTHING
            )
            SELECT 
                cs.cleaning_status_id,
                r.room_id,
                COALESCE(cs.status, 'Clean') as status,
                COALESCE(cs.last_updated, NOW()) as last_updated
            FROM public.rooms r
            LEFT JOIN public.cleaning_statuses cs ON r.room_id = cs.room_id
            ORDER BY r.room_number;
        `;
        await client.query(ensureAndFetchQuery);


        // --- STEP 2: AUTO-UPDATE LOGIC (IMPROVED) ---
        // ค้นหาห้องทั้งหมดที่มีผู้เข้าพักอยู่ (พักค้างคืน)
        const today = new Date().toISOString().split('T')[0];
        
        const occupiedRoomsQuery = `
            SELECT DISTINCT room_id 
            FROM public.bookings
            WHERE 
                check_in_date <= $1 AND 
                check_out_date > $1;
        `;
        const occupiedRoomsResult = await client.query(occupiedRoomsQuery, [today]);
        const roomIdsToUpdate = occupiedRoomsResult.rows.map(r => r.room_id);

        if (roomIdsToUpdate.length > 0) {
            // **THE DEFINITIVE FIX:**
            // เพิ่มเงื่อนไข `AND status = 'Clean' AND DATE(last_updated) < CURRENT_DATE`
            // เพื่อให้ระบบรีเซ็ตสถานะเป็น "Needs Cleaning" เพียงวันละครั้ง
            // และจะไม่เขียนทับสถานะที่พนักงานเพิ่งอัปเดตในวันเดียวกัน
            const updateQuery = `
                UPDATE public.cleaning_statuses 
                SET status = 'Needs Cleaning', last_updated = NOW() 
                WHERE room_id = ANY($1::int[])
                  AND status = 'Clean' 
                  AND DATE(last_updated) < CURRENT_DATE;
            `;
            await client.query(updateQuery, [roomIdsToUpdate]);
        }
        
        // --- STEP 3: ดึงข้อมูลล่าสุดและส่งกลับ ---
        // ใช้ LEFT JOIN อีกครั้งเพื่อให้แน่ใจว่าข้อมูลที่ส่งกลับครบถ้วนสมบูรณ์เสมอ
        const fetchQuery = `
            SELECT 
                cs.cleaning_status_id,
                r.room_id,
                COALESCE(cs.status, 'Clean') as status,
                COALESCE(cs.last_updated, NOW()) as last_updated
            FROM public.rooms r
            LEFT JOIN public.cleaning_statuses cs ON r.room_id = cs.room_id
            ORDER BY r.room_number;
        `;
        const { rows } = await client.query(fetchQuery);
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Get Cleaning Statuses Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

const updateStatus = async (req: VercelRequest, res: VercelResponse) => {
    const { room_id, status } = req.body;

    if (!room_id || !status || !['Clean', 'Needs Cleaning'].includes(status)) {
        return res.status(400).json({ message: 'Room ID and a valid status are required.' });
    }

    try {
        const query = `
            UPDATE public.cleaning_statuses 
            SET status = $1, last_updated = NOW() 
            WHERE room_id = $2
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [status, room_id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Room not found.' });
        }
        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Update Cleaning Status Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getStatuses(req, res);
  } else if (req.method === 'PUT') {
    return updateStatus(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}