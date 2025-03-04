import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // เปลี่ยนจาก axios

function Signup() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/signup', { username, email, password, bio, phone }); // ใช้ api และ endpoint
            navigate('/login');
        } catch (error) {
            console.error('Signup error:', error);
            setError(error.response?.data?.error || 'สมัครสมาชิกล้มเหลว');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-sky-800 mb-6 text-center">สมัครสมาชิก</h2>
            {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    placeholder="ชื่อผู้ใช้"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                    type="email"
                    placeholder="อีเมล"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                    type="password"
                    placeholder="รหัสผ่าน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <textarea
                    placeholder="ประวัติย่อ (เช่น เกี่ยวกับคุณ)"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 h-24"
                />
                <input
                    type="text"
                    placeholder="เบอร์โทรศัพท์"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                    type="submit"
                    className="w-full p-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition duration-200"
                >
                    สมัครสมาชิก
                </button>
            </form>
        </div>
    );
}

export default Signup;