import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';

function Profile() {
    const { user } = React.useContext(AuthContext);
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [errorMessage, setErrorMessage] = useState('');

    const fetchProfile = useCallback(async () => {
        try {
            const response = await axios.get('/api/users/me', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setProfile(response.data.user);
            setPosts(response.data.posts);
            setEditForm(response.data.user);
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchProfile();
    }, [user, navigate, fetchProfile]);

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('username', editForm.username || '');
        formData.append('email', editForm.email || '');
        formData.append('bio', editForm.bio || '');
        formData.append('phone', editForm.phone || '');
        if (editForm.profile_image && editForm.profile_image instanceof File) {
            formData.append('profile_image', editForm.profile_image);
        } else if (editForm.profile_image) {
            formData.append('profile_image', editForm.profile_image);
        }

        console.log('Sending data:', Object.fromEntries(formData));

        try {
            await axios.put('/api/users/me', formData, {
                headers: { 
                    Authorization: `Bearer ${user.token}`, 
                    'Content-Type': 'multipart/form-data' 
                }
            });
            setIsEditing(false);
            fetchProfile();
            setErrorMessage('');
        } catch (error) {
            console.error('Error updating profile:', error.response?.data || error.message);
            setErrorMessage(error.response?.data?.error || 'แก้ไขโปรไฟล์ล้มเหลว');
        }
    };

    if (!profile) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-4xl mx-auto">
            {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <h2 className="text-3xl font-bold text-sky-800 mb-4">แก้ไขโปรไฟล์</h2>
                    {errorMessage && (
                        <p className="text-red-600 text-center">{errorMessage}</p>
                    )}
                    <input
                        type="text"
                        placeholder="ชื่อผู้ใช้"
                        value={editForm.username || ''}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <input
                        type="email"
                        placeholder="อีเมล"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <textarea
                        placeholder="ประวัติย่อ"
                        value={editForm.bio || ''}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 h-24"
                    />
                    <input
                        type="text"
                        placeholder="เบอร์โทรศัพท์"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditForm({ ...editForm, profile_image: e.target.files[0] })}
                        className="w-full p-3 border border-gray-200 rounded-lg"
                    />
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            className="flex-1 p-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition duration-200"
                        >
                            บันทึก
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex-1 p-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-200"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    <div className="flex flex-col md:flex-row gap-6 mb-8">
                        <div className="flex-shrink-0">
                            {profile.profile_image ? (
                                <img
                                    src={`${profile.profile_image}`}
                                    alt={profile.username}
                                    className="w-32 h-32 rounded-full object-cover border-2 border-sky-600"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border-2 border-sky-600">
                                    ไม่มีรูป
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold text-sky-800 mb-2">{profile.username}</h2>
                            <p className="text-gray-600">อีเมล: {profile.email}</p>
                            <p className="text-gray-600 mt-1">เบอร์โทร: {profile.phone || 'ยังไม่ได้ระบุ'}</p>
                            <p className="text-gray-600 mt-1">เกี่ยวกับ: {profile.bio || 'ยังไม่มีประวัติย่อ'}</p>
                            <p className="text-gray-500 text-sm mt-1">สมัครเมื่อ: {new Date(profile.created_at).toLocaleDateString('th-TH')}</p>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="mt-4 p-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition duration-200"
                            >
                                แก้ไขโปรไฟล์
                            </button>
                        </div>
                    </div>
                    <h3 className="text-2xl font-semibold text-sky-800 mb-4">โพสต์ของฉัน</h3>
                    {posts.length === 0 ? (
                        <p className="text-gray-500 text-center">คุณยังไม่มีโพสต์</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.map(post => (
                                <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300">
                                    <Link to={`/pets/${post.id}`}>
                                        {post.image_url ? (
                                            <img src={`${post.image_url}`} alt={post.name} className="w-full h-48 object-cover" />
                                        ) : (
                                            <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">ไม่มีรูปภาพ</div>
                                        )}
                                        <div className="p-4">
                                            <h3 className="text-lg font-semibold text-sky-900 truncate">{post.name}</h3>
                                            <p className="text-gray-600 text-sm">{post.type}</p>
                                            <p className="text-sky-600 font-medium mt-1">{post.price} บาท</p>
                                            <p className="text-gray-500 text-sm mt-2 line-clamp-2">{post.description}</p>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Profile;