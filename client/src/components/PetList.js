import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';

function PetList({ pets }) {
    const { user } = React.useContext(AuthContext);
    const [favorites, setFavorites] = useState([]);

    const fetchFavorites = useCallback(async () => {
        if (!user) return;
        try {
            const response = await axios.get('http://localhost:5000/api/favorites', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setFavorites(response.data.map(fav => fav.id));
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchFavorites();
    }, [user, fetchFavorites]);

    const handleFavoriteToggle = async (petId) => {
        if (!user) {
            alert('กรุณาล็อกอินเพื่อเพิ่มในรายการโปรด');
            return;
        }
        try {
            if (favorites.includes(petId)) {
                await axios.delete(`http://localhost:5000/api/favorites/${petId}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setFavorites(favorites.filter(id => id !== petId));
            } else {
                await axios.post(
                    'http://localhost:5000/api/favorites',
                    { pet_id: petId },
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );
                setFavorites([...favorites, petId]);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            alert('เกิดข้อผิดพลาดในการจัดการรายการโปรด');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold text-sky-800 mb-6">รายการสัตว์เลี้ยง</h2>
            {pets.length === 0 ? (
                <p className="text-gray-500 text-center">ยังไม่มีสัตว์เลี้ยงในรายการ</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pets.map(pet => (
                        <div key={pet.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300">
                            <Link to={`/pets/${pet.id}`}>
                                {pet.image_url ? (
                                    <img src={`http://localhost:5000${pet.image_url}`} alt={pet.name} className="w-full h-48 object-cover" />
                                ) : (
                                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">ไม่มีรูปภาพ</div>
                                )}
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-sky-900 truncate">{pet.name}</h3>
                                    <p className="text-gray-600 text-sm">หมวดหมู่: {pet.category}</p>
                                    <p className="text-gray-600 text-sm">ประเภท: {pet.type}</p>
                                    <p className="text-sky-600 font-medium mt-1">{pet.price} บาท</p>
                                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">{pet.description}</p>
                                    <div className="mt-3 flex justify-between items-center">
                                        <span className="text-gray-400 text-xs">โดย: {pet.username}</span>
                                        <span className="bg-sky-100 text-sky-600 text-xs px-2 py-1 rounded-full">ดูเพิ่มเติม</span>
                                    </div>
                                </div>
                            </Link>
                            <button
                                onClick={() => handleFavoriteToggle(pet.id)}
                                className={`w-full p-2 mt-2 text-white rounded-b-lg transition ${favorites.includes(pet.id) ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                            >
                                {favorites.includes(pet.id) ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PetList;