import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';

function Cart() {
    const { user } = React.useContext(AuthContext);
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);

    const fetchCart = useCallback(async () => {
        try {
            const response = await axios.get('/api/cart', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setCartItems(response.data);
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchCart();
    }, [user, navigate, fetchCart]);

    const handleRemove = async (petId) => {
        try {
            await axios.delete(`/api/cart/${petId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchCart();
        } catch (error) {
            console.error('Error removing from cart:', error);
            alert('ลบออกจากตะกร้าล้มเหลว');
        }
    };

    const handleCheckout = async () => {
        try {
            console.log('Starting checkout for user:', user.id);
            const response = await axios.post(
                '/api/checkout',
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            console.log('Checkout response:', response.data);
            navigate('/orders');
            alert('สั่งซื้อสำเร็จ กรุณาดำเนินการชำระเงิน');
        } catch (error) {
            console.error('Error during checkout:', error.response?.data || error.message);
            alert('สั่งซื้อล้มเหลว: ' + (error.response?.data?.error || 'ไม่ทราบสาเหตุ'));
        }
    };

    if (!cartItems) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-sky-800 mb-6">ตะกร้าสินค้า</h2>
            {cartItems.length === 0 ? (
                <p className="text-gray-500 text-center">ตะกร้าว่างเปล่า</p>
            ) : (
                <div className="space-y-6">
                    {cartItems.map(item => (
                        <div key={item.id} className="p-4 bg-gray-50 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                {item.image_url ? (
                                    <img src={`${item.image_url}`} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                                ) : (
                                    <div className="w-20 h-20 bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg">ไม่มีรูปภาพ</div>
                                )}
                                <div>
                                    <h3 className="text-lg font-semibold text-sky-900">{item.name}</h3>
                                    <p className="text-gray-600">หมวดหมู่: {item.category}</p>
                                    <p className="text-gray-600">ประเภท: {item.type}</p>
                                    <p className="text-sky-600 font-medium">ราคา: {item.price} บาท</p>
                                    <p className="text-sky-600 font-medium">ค่าส่ง: {item.shipping_cost} บาท</p>
                                    <p className="text-gray-500 mt-1">{item.description}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemove(item.pet_id)}
                                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                ลบ
                            </button>
                        </div>
                    ))}
                    <div className="flex justify-end">
                        <button
                            onClick={handleCheckout}
                            className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            สั่งซื้อ
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Cart;