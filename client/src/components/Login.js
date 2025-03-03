import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/login', { email, password });
            login(response.data.token, response.data.user);
        } catch (error) {
            console.error('Login error:', error);
            alert('ล็อกอินล้มเหลว');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-sky-800 mb-6 text-center">ล็อกอิน</h2>
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