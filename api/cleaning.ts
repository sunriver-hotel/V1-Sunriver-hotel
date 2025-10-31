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
        // --- AUTO-UPDATE LOGIC ---
        // This logic runs every time statuses are fetched, effectively simulating a daily job.
        // It finds all rooms that are currently occupied (staying overnight) and marks them as needing cleaning.
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
            const updateQuery = `
                UPDATE public.cleaning_statuses 
                SET status = 'Needs Cleaning', last_updated = NOW() 
                WHERE room_id = ANY($1::int[]);
            `;
            await client.query(updateQuery, [roomIdsToUpdate]);
        }
        
        // --- FETCH AND RETURN ---
        const fetchQuery = `
            SELECT cleaning_status_id, room_id, status, last_updated 
            FROM public.cleaning_statuses 
            ORDER BY room_id;
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
