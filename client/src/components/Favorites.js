import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';

function Favorites() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchFavorites();
    }, [user, navigate]);

    const fetchFavorites = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/favorites', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setFavorites(response.data);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-sky-800 mb-6">รายการโปรด</h2>
            {favorites.length === 0 ? (
                <p className="text-gray-500 text-center">คุณยังไม่มีรายการโปรด</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map(pet => (
                        <Link to={`/pets/${pet.id}`} key={pet.id}>
                            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300">
                                {pet.image_url ? (
                                    <img src={`http://localhost:5000${pet.image_url}`} alt={pet.name} className="w-full h-48 object-cover" />
                                ) : (
                                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">ไม่มีรูปภาพ</div>
                                )}
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-sky-900 truncate">{pet.name}</h3>
                                    <p className="text-gray-600 text-sm">{pet.type}</p>
                                    <p className="text-sky-600 font-medium mt-1">{pet.price} บาท</p>
                                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">{pet.description}</p>
                                    <p className="text-gray-400 text-xs mt-1">โดย: {pet.username}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Favorites;