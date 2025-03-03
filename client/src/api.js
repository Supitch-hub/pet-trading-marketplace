import axios from 'axios';

// สร้าง axios instance โดยใช้ REACT_APP_API_URL จาก environment variable
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000', // fallback เป็น localhost ถ้าไม่มี env
});

export default api;