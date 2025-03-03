import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';

function AdminDashboard() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchUsers();
        fetchPosts();
    }, [user, navigate]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/users', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchPosts = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/pets', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setPosts(response.data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const handleDeletePost = async (postId) => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?')) {
            try {
                await axios.delete(`http://localhost:5000/api/pets/${postId}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                fetchPosts();
                alert('ลบโพสต์สำเร็จ');
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('ลบโพสต์ล้มเหลว');
            }
        }
    };

    if (!users || !posts) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-sky-800 mb-6">แดชบอร์ดแอดมิน</h2>
            
            <div className="mb-10">
                <h3 className="text-2xl font-semibold text-sky-700 mb-4">จัดการผู้ใช้</h3>
                {users.length === 0 ? (
                    <p className="text-gray-500">ไม่มีผู้ใช้</p>
                ) : (
                    <div className="space-y-4">
                        {users.map(u => (
                            <div key={u.id} className="p-4 bg-gray-50 rounded-lg shadow-sm">
                                <p className="text-gray-600">ชื่อผู้ใช้: {u.username}</p>
                                <p className="text-gray-600">อีเมล: {u.email}</p>
                                <p className="text-gray-600">บทบาท: {u.role}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-2xl font-semibold text-sky-700 mb-4">จัดการโพสต์</h3>
                {posts.length === 0 ? (
                    <p className="text-gray-500">ไม่มีโพสต์</p>
                ) : (
                    <div className="space-y-4">
                        {posts.map(post => (
                            <div key={post.id} className="p-4 bg-gray-50 rounded-lg shadow-sm flex justify-between items-center">
                                <div>
                                    <h4 className="text-lg font-semibold text-sky-900">{post.name}</h4>
                                    <p className="text-gray-600">โดย: {post.username}</p>
                                </div>
                                <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                >
                                    ลบโพสต์
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;