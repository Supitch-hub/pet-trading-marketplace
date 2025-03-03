import React, { useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';

function Login() {
    const { login } = React.useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/login', { email, password });
            login(response.data.token, { id: response.data.id, username: response.data.username });
        } catch (err) {
            setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการล็อกอิน');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-md mx-auto mt-8">
            <h2 className="text-2xl font-semibold text-sky-800 mb-6">ล็อกอิน</h2>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <button
                    type="submit"
                    className="w-full p-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition duration-200"
                >
                    ล็อกอิน
                </button>
            </form>
        </div>
    );
}

export default Login;