import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; // ลบ useNavigate
import axios from 'axios';

function PublicProfile() {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);

    const fetchProfile = useCallback(async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${id}`);
            setProfile(response.data.user);
            setPosts(response.data.posts);
        } catch (error) {
            console.error('Error fetching public profile:', error);
        }
    }, [id]);

    useEffect(() => {
        fetchProfile();
    }, [id, fetchProfile]);

    if (!profile) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="flex-shrink-0">
                    {profile.profile_image ? (
                        <img
                            src={`${process.env.REACT_APP_API_URL}${profile.profile_image}`}
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
                    <p className="text-gray-600">เกี่ยวกับ: {profile.bio || 'ยังไม่มีประวัติย่อ'}</p>
                    <p className="text-gray-500 text-sm mt-1">สมัครเมื่อ: {new Date(profile.created_at).toLocaleDateString('th-TH')}</p>
                </div>
            </div>
            <h3 className="text-2xl font-semibold text-sky-800 mb-4">โพสต์ของ {profile.username}</h3>
            {posts.length === 0 ? (
                <p className="text-gray-500 text-center">ยังไม่มีโพสต์</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map(post => (
                        <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300">
                            <Link to={`/pets/${post.id}`}>
                                {post.image_url ? (
                                    <img src={`${process.env.REACT_APP_API_URL}${post.image_url}`} alt={post.name} className="w-full h-48 object-cover" />
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
        </div>
    );
}

export default PublicProfile;