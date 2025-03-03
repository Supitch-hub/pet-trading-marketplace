import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';

function Favorites() {
    const { user } = React.useContext(AuthContext);
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState([]);

    const fetchFavorites = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/favorites', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setFavorites(response.data);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchFavorites();
    }, [user, navigate, fetchFavorites]);

    const handleRemoveFavorite = async (petId) => {
        try {
            await axios.delete(`http://localhost:5000/api/favorites/${petId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setFavorites(favorites.filter(fav => fav.id !== petId));
        } catch (error) {
            console.error('Error removing favorite:', error);
            alert('ลบออกจากรายการโปรดล้มเหลว');
        }
    };

    if (!favorites) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-sky-800 mb-6">รายการโปรดของฉัน</h2>
            {favorites.length === 0 ? (
                <p className="text-gray-500 text-center">คุณยังไม่มีรายการโปรด</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map(fav => (
                        <div key={fav.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300">
                            <Link to={`/pets/${fav.id}`}>
                                {fav.image_url ? (
                                    <img src={`http://localhost:5000${fav.image_url}`} alt={fav.name} className="w-full h-48 object-cover" />
                                ) : (
                                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">ไม่มีรูปภาพ</div>
                                )}
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-sky-900 truncate">{fav.name}</h3>
                                    <p className="text-gray-600 text-sm">{fav.type}</p>
                                    <p className="text-sky-600 font-medium mt-1">{fav.price} บาท</p>
                                </div>
                            </Link>
                            <button
                                onClick={() => handleRemoveFavorite(fav.id)}
                                className="w-full p-2 bg-red-600 text-white rounded-b-lg hover:bg-red-700 transition"
                            >
                                ลบออกจากรายการโปรด
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Favorites;