// This file implements the authentication service.
// It makes an API call to a backend endpoint (e.g., a Vercel Serverless Function)
// which securely connects to the Neon database.
// The frontend **must not** connect directly to the database for security reasons.

/**
 * Calls the backend login API.
 * @param username The user's username.
 * @param password The user's password.
 * @returns A promise that resolves if credentials are valid.
 */
export const login = async (username: string, password: string): Promise<{ success: boolean }> => {
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
    
    // API จะส่ง { success: true } กลับมาเมื่อ login สำเร็จ
    return await response.json(); 
  } catch (error) {
    console.error('Login API call failed:', error);
    // บล็อก catch นี้จะจัดการกับปัญหา network หรือปัญหาที่ตัว API endpoint
    // ข้อความ error ที่ throw ออกไปจะถูกนำไปแสดงผลให้ผู้ใช้เห็น
    throw error;
  }
};