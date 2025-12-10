
import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';

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
        // If the table doesn't exist, gracefully return null. This is not a critical error.
        if (error instanceof Error && (error as any).code === '42P01') { // 42P01 is undefined_table
             return res.status(200).json({ logo: null });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const saveSetting = async (req: VercelRequest, res: VercelResponse) => {
    const { key, value } = req.body;

    if (key !== 'logo' || typeof value !== 'string') {
        return res.status(400).json({ message: 'Invalid payload. Required: { key: "logo", value: "..." }' });
    }
    
    // Check for Cloudinary env vars
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return res.status(500).json({ message: 'Cloudinary environment variables are not configured on the server.' });
    }

    const client = await pool.connect();
    try {
        // Configure Cloudinary
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        // Upload to Cloudinary with more specific error handling
        const uploadResponse = await cloudinary.uploader.upload(value, {
            public_id: 'sunriver_hotel_logo', // Use a fixed public ID to overwrite
            overwrite: true,
            folder: 'sunriver_hotel' // Organize in a folder
        }).catch(err => {
            console.error('Cloudinary Upload Error:', err);
            throw new Error(`Cloudinary upload failed: ${err.message || 'Unknown error'}`);
        });

        if (!uploadResponse || !uploadResponse.secure_url) {
            throw new Error('Cloudinary upload did not return a valid response or URL.');
        }

        const logoUrl = uploadResponse.secure_url;
        
        // Save the Cloudinary URL to the database
        const query = `
            INSERT INTO public.app_settings (setting_key, setting_value)
            VALUES ($1, $2)
            ON CONFLICT (setting_key) DO UPDATE
            SET setting_value = $2;
        `;
        await client.query(query, [key, logoUrl]);
        
        return res.status(200).json({ success: true, message: 'Logo saved successfully.', logoUrl: logoUrl });

    } catch (error) {
        console.error('Save Setting Error (Cloudinary/DB):', error);

        let errorMessage = 'An unexpected error occurred.';
        if (error instanceof Error) {
            errorMessage = error.message; // Use the specific error from the try block
             if ((error as any).code === '42P01') {
                errorMessage = 'The `app_settings` table does not exist. Please run the required SQL command.';
            }
        }
        
        return res.status(500).json({ message: errorMessage });
    } finally {
        client.release();
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
