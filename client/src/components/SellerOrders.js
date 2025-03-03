import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';

function SellerOrders() {
    const { user } = React.useContext(AuthContext);
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);

    const fetchOrders = useCallback(async () => {
        try {
            const response = await axios.get('/api/seller/orders', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching seller orders:', error);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchOrders();
    }, [user, navigate, fetchOrders]);

    const handleVerifyPayment = async (orderId) => {
        try {
            await axios.put(`/api/payments/${orderId}/verify`, {}, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchOrders();
            alert('ยืนยันการชำระเงินสำเร็จ');
        } catch (error) {
            console.error('Error verifying payment:', error);
            alert('ยืนยันการชำระเงินล้มเหลว');
        }
    };

    const handleShipping = async (orderId) => {
        try {
            await axios.put(
                `/api/orders/${orderId}/shipped`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            fetchOrders();
            alert('แจ้งขนส่งสำเร็จ รอผู้ซื้อรับสินค้า');
        } catch (error) {
            console.error('Error notifying shipping:', error);
            alert('แจ้งขนส่งล้มเหลว');
        }
    };

    if (!orders) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-sky-800 mb-6">คำสั่งซื้อที่รอจัดการ</h2>
            {orders.length === 0 ? (
                <p className="text-gray-500 text-center">ไม่มีคำสั่งซื้อที่รอจัดการ</p>
            ) : (
                <div className="space-y-6">
                    {orders.map(order => (
                        <div key={order.id} className="p-4 bg-gray-50 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                {order.image_url ? (
                                    <img src={`${order.image_url}`} alt={order.name} className="w-20 h-20 object-cover rounded-lg" />
                                ) : (
                                    <div className="w-20 h-20 bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg">ไม่มีรูปภาพ</div>
                                )}
                                <div>
                                    <h3 className="text-lg font-semibold text-sky-900">{order.name}</h3>
                                    <p className="text-gray-600">ผู้ซื้อ: {order.buyer_username}</p>
                                    <p className="text-gray-600">ราคา: {order.amount} บาท</p>
                                    <p className="text-gray-600">สถานะคำสั่งซื้อ: {
                                        order.status === 'payment_submitted' ? 'ส่งชำระเงินแล้ว รอการยืนยัน' :
                                        order.status === 'confirmed' ? 'ยืนยันการชำระเงินแล้ว' :
                                        order.status === 'shipped' ? 'จัดส่งแล้ว' : 'ไม่ทราบสถานะ'
                                    }</p>
                                    <p className="text-gray-600">สถานะการชำระเงิน: {
                                        order.payment_status === 'submitted' ? 'ส่งหลักฐานแล้ว รอตรวจสอบ' :
                                        order.payment_status === 'paid' ? 'ชำระเงินสำเร็จ' : 'รอชำระ'
                                    }</p>
                                    {order.payment_proof && (
                                        <a href={`${order.payment_proof}`} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">ดูหลักฐานการชำระเงิน</a>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                {order.status === 'payment_submitted' && (
                                    <button
                                        onClick={() => handleVerifyPayment(order.id)}
                                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                    >
                                        ตรวจสอบและยืนยันการชำระเงิน
                                    </button>
                                )}
                                {order.status === 'confirmed' && (
                                    <button
                                        onClick={() => handleShipping(order.id)}
                                        className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                                    >
                                        แจ้งขนส่ง
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SellerOrders;