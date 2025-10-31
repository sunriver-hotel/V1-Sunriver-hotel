import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1,
});

const getBookings = async (req: VercelRequest, res: VercelResponse) => {
  const { year, month } = req.query;
  if (!year || !month) {
    return res.status(400).json({ message: 'Year and month are required' });
  }

  try {
    const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    const endDate = new Date(Date.UTC(Number(year), Number(month), 1)); // Go to the start of the next month
    
    const query = `
      SELECT 
        b.booking_id, b.customer_id, b.room_id, 
        TO_CHAR(b.check_in_date, 'YYYY-MM-DD') as check_in_date, 
        TO_CHAR(b.check_out_date, 'YYYY-MM-DD') as check_out_date, 
        b.status, b.price_per_night, b.deposit, b.created_at,
        json_build_object(
            'customer_id', c.customer_id,
            'customer_name', c.customer_name,
            'phone', c.phone,
            'email', c.email,
            'address', c.address,
            'tax_id', c.tax_id
        ) as customer,
        json_build_object(
            'room_id', r.room_id,
            'room_number', r.room_number,
            'room_type', r.room_type,
            'bed_type', r.bed_type,
            'floor', r.floor
        ) as room
      FROM public.bookings b
      JOIN public.customers c ON b.customer_id = c.customer_id
      JOIN public.rooms r ON b.room_id = r.room_id
      WHERE b.check_in_date < $2 AND b.check_out_date > $1
    `;

    const { rows } = await pool.query(query, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Get Bookings Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const createBooking = async (req: VercelRequest, res: VercelResponse) => {
    const { customer, room_ids, check_in_date, check_out_date, status, price_per_night, deposit } = req.body;
    
    if (!customer || !customer.customer_name || !customer.phone || !Array.isArray(room_ids) || room_ids.length === 0 || !check_in_date || !check_out_date) {
        return res.status(400).json({ message: 'Missing required fields for booking.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let customerId = customer.customer_id;
        // Upsert customer based on phone number to avoid duplicates
        if (!customerId) {
            const existingCustomer = await client.query('SELECT customer_id FROM public.customers WHERE phone = $1', [customer.phone]);
            if (existingCustomer.rows.length > 0) {
                customerId = existingCustomer.rows[0].customer_id;
                // Update existing customer details if they've changed
                await client.query(
                    'UPDATE public.customers SET customer_name = $1, email = $2, address = $3, tax_id = $4 WHERE customer_id = $5',
                    [customer.customer_name, customer.email, customer.address, customer.tax_id, customerId]
                );
            } else {
                const newCustomer = await client.query(
                    'INSERT INTO public.customers (customer_name, phone, email, address, tax_id) VALUES ($1, $2, $3, $4, $5) RETURNING customer_id',
                    [customer.customer_name, customer.phone, customer.email, customer.address, customer.tax_id]
                );
                customerId = newCustomer.rows[0].customer_id;
            }
        }
        
        const createdBookings = [];
        // Loop through all selected rooms and create a booking for each
        for (const room_id of room_ids) {
            // **THE FIX:** Use the database sequence to generate a unique number.
            // This is atomic and safe for concurrent requests, eliminating race conditions.
            const sequenceResult = await client.query("SELECT NEXTVAL('booking_seq') as next_val");
            const nextVal = sequenceResult.rows[0].next_val;

            const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const paddedVal = String(nextVal).padStart(3, '0');
            const booking_id = `SRH-${datePrefix}-${paddedVal}`;

            const bookingQuery = `
                INSERT INTO public.bookings (booking_id, customer_id, room_id, check_in_date, check_out_date, status, price_per_night, deposit)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *;
            `;
            // If this INSERT fails for any other reason (e.g., check constraint), the entire transaction will be rolled back.
            const bookingResult = await client.query(bookingQuery, [booking_id, customerId, room_id, check_in_date, check_out_date, status, price_per_night, deposit]);
            createdBookings.push(bookingResult.rows[0]);
        }

        await client.query('COMMIT');
        return res.status(201).json(createdBookings);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create Booking Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        client.release();
    }
};


const updateBooking = async (req: VercelRequest, res: VercelResponse) => {
  const { booking_id, customer, room_id, check_in_date, check_out_date, status, price_per_night, deposit } = req.body;

  if (!booking_id || !customer || !customer.customer_id) {
    return res.status(400).json({ message: 'Booking ID and Customer ID are required for update.'});
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
        'UPDATE public.customers SET customer_name = $1, phone = $2, email = $3, address = $4, tax_id = $5 WHERE customer_id = $6',
        [customer.customer_name, customer.phone, customer.email, customer.address, customer.tax_id, customer.customer_id]
    );

    const bookingQuery = `
        UPDATE public.bookings 
        SET room_id = $1, check_in_date = $2, check_out_date = $3, status = $4, price_per_night = $5, deposit = $6
        WHERE booking_id = $7
        RETURNING *;
    `;
    const bookingResult = await client.query(bookingQuery, [room_id, check_in_date, check_out_date, status, price_per_night, deposit, booking_id]);

    await client.query('COMMIT');

    if (bookingResult.rows.length === 0) {
        return res.status(404).json({ message: 'Booking not found' });
    }
    return res.status(200).json(bookingResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update Booking Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    client.release();
  }
};

const deleteBooking = async (req: VercelRequest, res: VercelResponse) => {
    const { booking_id } = req.body;
    if (!booking_id) {
        return res.status(400).json({ message: 'Booking ID is required.' });
    }
    try {
        const result = await pool.query('DELETE FROM public.bookings WHERE booking_id = $1', [booking_id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Booking not found.' });
        }
        return res.status(200).json({ success: true, message: 'Booking deleted successfully.' });
    } catch (error) {
        console.error('Delete Booking Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getBookings(req, res);
  } else if (req.method === 'POST') {
    return createBooking(req, res);
  } else if (req.method === 'PUT') {
    return updateBooking(req, res);
  } else if (req.method === 'DELETE') {
    return deleteBooking(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}