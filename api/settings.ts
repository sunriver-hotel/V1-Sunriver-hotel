import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1,
});

const getSetting = async (req: VercelRequest, res: VercelResponse) => {
    try {
        const query = `SELECT setting_value FROM public.app_settings WHERE setting_key = 'logo'`;
        const { rows } = await pool.query(query);

        if (rows.length > 0) {
            res.status(200).json({ logo: rows[0].setting_value });
        } else {
            res.status(200).json({ logo: null }); // No logo found
        }
    } catch (error) {
        console.error('Get Setting Error:', error);
        // Check if the error is because the table doesn't exist
        if (error instanceof Error && (error as any).code === '42P01') { // 42P01 is undefined_table
             return res.status(500).json({ message: 'The `app_settings` table does not exist. Please run the required SQL command.' });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const saveSetting = async (req: VercelRequest, res: VercelResponse) => {
    const { key, value } = req.body;

    if (key !== 'logo' || typeof value !== 'string') {
        return res.status(400).json({ message: 'Invalid payload. Required: { key: "logo", value: "..." }' });
    }

    try {
        // Use UPSERT to either insert a new setting or update an existing one
        const query = `
            INSERT INTO public.app_settings (setting_key, setting_value)
            VALUES ($1, $2)
            ON CONFLICT (setting_key) DO UPDATE
            SET setting_value = $2;
        `;
        await pool.query(query, [key, value]);
        return res.status(200).json({ success: true, message: 'Logo saved successfully.' });
    } catch (error) {
        console.error('Save Setting Error:', error);
        if (error instanceof Error && (error as any).code === '42P01') {
             return res.status(500).json({ message: 'The `app_settings` table does not exist. Please run the required SQL command.' });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getSetting(req, res);
  } else if (req.method === 'POST') {
    return saveSetting(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}