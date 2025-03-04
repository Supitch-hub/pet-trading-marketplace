import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../App';

function PetDetail() {
    const { id } = useParams();
    const { user } = React.useContext(AuthContext);
    const navigate = useNavigate();
    const [pet, setPet] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState('');
    const [comment, setComment] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [isFavorite, setIsFavorite] = useState(false);

    const fetchPet = useCallback(async () => {
        try {
            const response = await api.get(`/api/pets/${id}`);
            setPet(response.data.pet);
            setReviews(response.data.reviews);
            setEditForm(response.data.pet);
        } catch (error) {
            console.error('Error fetching pet:', error);
        }
    }, [id]);

    const checkFavorite = useCallback(async () => {
        try {
            const response = await api.get('/api/favorites', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const isFav = response.data.some(fav => fav.id === parseInt(id));
            setIsFavorite(isFav);
        } catch (error) {
            console.error('Error checking favorite:', error);
        }
    }, [user, id]);

    useEffect(() => {
        fetchPet();
        if (user) checkFavorite();
    }, [id, user, fetchPet, checkFavorite]);

    const handleFavoriteToggle = async () => {
        if (!user) {
            alert('กรุณาล็อกอินเพื่อเพิ่มในรายการโปรด');
            return;
        }
        try {
            if (isFavorite) {
                await api.delete(`/api/favorites/${id}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setIsFavorite(false);
            } else {
                await api.post(
                    '/api/favorites',
                    { pet_id: id },
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );
                setIsFavorite(true);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            alert('เกิดข้อผิดพลาดในการจัดการรายการโปรด');
        }
    };

    const handleAddToCart = async () => {
        if (!user) {
            alert('กรุณาล็อกอินเพื่อเพิ่มในตะกร้า');
            return;
        }
        try {
            await api.post(
                '/api/cart',
                { pet_id: parseInt(id) },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            alert('เพิ่มในตะกร้าสำเร็จ');
        } catch (error) {
            console.error('Error adding to cart:', error.response?.data || error.message);
            alert('เพิ่มในตะกร้าล้มเหลว: ' + (error.response?.data?.error || 'ไม่ทราบสาเหตุ'));
        }
    };

    const handleDelete = async () => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?')) {
            if (window.confirm('คุณแน่ใจจริงๆ หรือไม่? การลบนี้ไม่สามารถย้อนกลับได้')) {
                try {
                    await api.delete(`/api/pets/${id}`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    navigate('/', { replace: true, state: { refresh: true } });
                } catch (error) {
                    console.error('Error deleting pet:', error);
                    alert('ลบโพสต์ล้มเหลว');
                }
            }
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', editForm.name);
        formData.append('type', editForm.type);
        formData.append('price', parseFloat(editForm.price));
        formData.append('description', editForm.description);
        formData.append('category', editForm.category);
        formData.append('shipping_cost', parseFloat(editForm.shipping_cost));
        if (editForm.image) formData.append('image', editForm.image);

        try {
            await api.put(`/api/pets/${id}`, formData, {
                headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' }
            });
            setIsEditing(false);
            fetchPet();
        } catch (error) {
            console.error('Error updating pet:', error);
            alert('แก้ไขโพสต์ล้มเหลว');
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('กรุณาล็อกอินเพื่อรีวิว');
            return;
        }
        try {
            const response = await api.post(
                `/api/pets/${id}/reviews`,
                { rating: parseInt(rating), comment },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setReviews([...reviews, response.data]);
            setRating('');
            setComment('');
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('ส่งรีวิวล้มเหลว');
        }
    };

    if (!pet) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-5xl mx-auto">
            {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-6">
                    <h2 className="text-3xl font-bold text-sky-800 mb-4">แก้ไขโพสต์</h2>
                    <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                    />
                    <input
                        type="text"
                        value={editForm.type}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                    />
                    <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                    />
                    <input
                        type="number"
                        value={editForm.shipping_cost}
                        onChange={(e) => setEditForm({ ...editForm, shipping_cost: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                        placeholder="ค่าส่ง (บาท)"
                    />
                    <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                    >
                        <option value="">เลือกหมวดหมู่</option>
                        <option value="สุนัข">สุนัข</option>
                        <option value="แมว">แมว</option>
                        <option value="นก">นก</option>
                        <option value="ปลา">ปลา</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditForm({ ...editForm, image: e.target.files[0] })}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 h-32 shadow-sm"
                    />
                    <div className="flex gap-4">
                        <button type="submit" className="flex-1 p-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition duration-200 shadow-md">
                            บันทึก
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex-1 p-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-200 shadow-md"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            {pet.image_url ? (
                                <img
                                    src={`${pet.image_url}`}
                                    alt={pet.name}
                                    className="w-full h-96 object-cover rounded-lg shadow-lg"
                                    onError={(e) => e.target.src = 'https://via.placeholder.com/300'}
                                />
                            ) : (
                                <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg text-gray-500 shadow-lg">
                                    ไม่มีรูปภาพ
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-bold text-sky-800">{pet.name}</h2>
                            <div className="bg-sky-50 p-4 rounded-lg shadow-sm">
                                <p className="text-gray-700 text-lg">หมวดหมู่: <span className="font-medium">{pet.category}</span></p>
                                <p className="text-gray-700 text-lg">ประเภท: <span className="font-medium">{pet.type}</span></p>
                                <p className="text-sky-600 font-bold text-2xl mt-2">ราคา: {pet.price} บาท</p>
                                <p className="text-sky-600 font-bold text-xl mt-1">ค่าส่ง: {pet.shipping_cost} บาท</p>
                                <p className="text-gray-600 mt-2">{pet.description}</p>
                            </div>
                            <p className="text-gray-600 text-sm">โพสต์โดย: <span className="font-medium">{pet.username}</span></p>
                            <div className="flex gap-4 flex-wrap">
                                {user && (
                                    <button
                                        onClick={handleFavoriteToggle}
                                        className={`p-3 rounded-lg transition transform hover:scale-105 ${isFavorite ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} shadow-md`}
                                    >
                                        {isFavorite ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
                                    </button>
                                )}
                                {user && user.id !== pet.user_id && (
                                    <button
                                        onClick={handleAddToCart}
                                        className="p-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition transform hover:scale-105 shadow-md"
                                    >
                                        ใส่ตะกร้า
                                    </button>
                                )}
                                {user && user.id && pet.user_id && user.id === pet.user_id && (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition transform hover:scale-105 shadow-md"
                                        >
                                            แก้ไข
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition transform hover:scale-105 shadow-md"
                                        >
                                            ลบ
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-10">
                        <h3 className="text-2xl font-semibold text-sky-800 mb-4">รีวิว</h3>
                        {reviews.length === 0 ? (
                            <p className="text-gray-500">ยังไม่มีรีวิว</p>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map(review => (
                                    <div key={review.id} className="p-4 bg-sky-50 rounded-lg shadow-sm">
                                        <p className="text-gray-600">คะแนน: {review.rating}/5</p>
                                        <p className="text-gray-500">{review.comment}</p>
                                        <p className="text-gray-400 text-sm mt-1">โดย: {review.username}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {user && (
                        <form onSubmit={handleReviewSubmit} className="mt-8">
                            <h3 className="text-xl font-semibold text-sky-800 mb-2">เขียนรีวิว</h3>
                            <div className="space-y-4">
                                <input
                                    type="number"
                                    placeholder="คะแนน (1-5)"
                                    value={rating}
                                    onChange={(e) => setRating(e.target.value)}
                                    min="1"
                                    max="5"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                                />
                                <textarea
                                    placeholder="ความคิดเห็น"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 h-24 shadow-sm"
                                />
                                <button
                                    type="submit"
                                    className="w-full p-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition duration-200 shadow-md"
                                >
                                    ส่งรีวิว
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </div>
    );
}

export default PetDetail;