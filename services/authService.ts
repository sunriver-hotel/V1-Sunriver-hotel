// This file implements the authentication service.
// It makes an API call to a backend endpoint (e.g., a Vercel Serverless Function)
// which securely connects to the Neon database.
// The frontend **must not** connect directly to the database for security reasons.

import type { UserRole } from '../types';

interface RegisterPayload {
  username: string;
  password: string;
  nickname: string;
}

/**
 * Calls the backend login API.
 * @param username The user's username.
 * @param password The user's password.
 * @returns A promise that resolves if credentials are valid.
 */
export const login = async (username: string, password: string): Promise<{ success: boolean; role: UserRole }> => {
  // --- THIS IS THE REAL IMPLEMENTATION ---
  // This code calls the backend API endpoint at `/api/login`.
  // You must create this endpoint as a Vercel Serverless Function
  // (using the code provided separately) for the login to work when deployed.
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      // API ควรจะส่งข้อความ error กลับมาเมื่อ login ไม่สำเร็จ
      // เราจะใช้ข้อความจาก JSON response ของฝั่ง backend
      const errorData = await response.json().catch(() => ({ message: 'Invalid username or password' }));
      throw new Error(errorData.message);
    }
    
    // API will return { success: true, role: '...' } on successful login
    return await response.json(); 
  } catch (error) {
    console.error('Login API call failed:', error);
    // บล็อก catch นี้จะจัดการกับปัญหา network หรือปัญหาที่ตัว API endpoint
    // ข้อความ error ที่ throw ออกไปจะถูกนำไปแสดงผลให้ผู้ใช้เห็น
    throw error;
  }
};

/**
 * Calls the backend register API.
 * @param payload The registration data.
 * @returns A promise that resolves if registration is successful.
 */
export const register = async (payload: RegisterPayload): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      // Use the error message from the backend response
      throw new Error(data.message || 'Registration failed.');
    }
    
    return data;
  } catch (error) {
    console.error('Register API call failed:', error);
    // Re-throw the error to be caught by the component
    throw error;
  }
};
