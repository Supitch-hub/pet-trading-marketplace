import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';

function Orders() {
    const { user } = React.useContext(AuthContext);
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState('');
    const [paymentProof, setPaymentProof] = useState(null);

    const fetchOrders = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/orders', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchOrders();
    }, [user, navigate, fetchOrders]);

    const handlePayment = async (orderId) => {
        if (!selectedMethod) {
            alert('กรุณาเลือกวิธีการชำระเงิน');
            return;
        }
        const formData = new FormData();
        formData.append('payment_method', selectedMethod);
        if (paymentProof) formData.append('payment_proof', paymentProof);

        try {
            await axios.put(
                `http://localhost:5000/api/payments/${orderId}`,
                formData,
                { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' } }
            );
            fetchOrders();
            alert(selectedMethod === 'bank_transfer' ? 'ส่งหลักฐานการชำระเงินสำเร็จ รอผู้ขายยืนยัน' : 'ชำระเงินสำเร็จ');
        } catch (error) {
            console.error('Error processing payment:', error);
            alert('ชำระเงินล้มเหลว');
        }
    };

    const handleConfirmDelivery = async (orderId) => {
        if (window.confirm('คุณได้รับสินค้าแล้วใช่หรือไม่?')) {
            try {
                await axios.put(
                    `http://localhost:5000/api/orders/${orderId}/delivered`,
                    {},
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );
                fetchOrders();
                alert('ยืนยันรับสินค้าสำเร็จ');
            } catch (error) {
                console.error('Error confirming delivery:', error);
                alert('ยืนยันรับสินค้าล้มเหลว');
            }
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำสั่งซื้อนี้?')) {
            try {
                await axios.put(
                    `http://localhost:5000/api/orders/${orderId}/cancel`,
                    {},
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );
                fetchOrders();
                alert('ยกเลิกคำสั่งซื้อสำเร็จ');
            } catch (error) {
                console.error('Error cancelling order:', error);
                alert('ยกเลิกคำสั่งซื้อล้มเหลว');
            }
        }
    };

    if (!orders) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-sky-800 mb-6">คำสั่งซื้อของฉัน</h2>
            {orders.length === 0 ? (
                <p className="text-gray-500 text-center">คุณยังไม่มีคำสั่งซื้อ</p>
            ) : (
                <div className="space-y-6">
                    {orders.map(order => (
                        <div key={order.id} className="p-4 bg-gray-50 rounded-lg shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    {order.image_url ? (
                                        <img src={`http://localhost:5000${order.image_url}`} alt={order.name} className="w-20 h-20 object-cover rounded-lg" />
                                    ) : (
                                        <div className="w-20 h-20 bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg">ไม่มีรูปภาพ</div>
                                    )}
                                    <div>
                                        <h3 className="text-lg font-semibold text-sky-900">{order.name}</h3>
                                        <p className="text-gray-600">ราคา: {order.amount} บาท</p>
                                        <p className="text-gray-600">สถานะคำสั่งซื้อ: {
                                            order.status === 'pending_payment' ? 'รอการชำระเงิน' :
                                            order.status === 'payment_submitted' ? 'ส่งชำระเงินแล้ว รอผู้ขายยืนยัน' :
                                            order.status === 'confirmed' ? 'ยืนยันการชำระเงินแล้ว' :
                                            order.status === 'shipped' ? 'จัดส่งแล้ว' :
                                            order.status === 'delivered' ? 'ถึงปลายทางแล้ว' :
                                            order.status === 'completed' ? 'สำเร็จ' :
                                            order.status === 'cancelled' ? 'ยกเลิกแล้ว' : 'ไม่ทราบสถานะ'
                                        }</p>
                                        <p className="text-gray-600">สถานะการชำระเงิน: {
                                            order.payment_status === 'pending' ? 'รอชำระเงิน' :
                                            order.payment_status === 'submitted' ? 'ส่งหลักฐานแล้ว รอตรวจสอบ' :
                                            order.payment_status === 'paid' ? 'ชำระเงินสำเร็จ' :
                                            order.payment_status === 'failed' ? 'ชำระเงินล้มเหลว' : 'ไม่ทราบสถานะ'
                                        }</p>
                                    </div>
                                </div>
                                <div className="w-full md:w-auto flex flex-col gap-2">
                                    {order.status === 'pending_payment' && (
                                        <>
                                            <select
                                                value={selectedMethod}
                                                onChange={(e) => setSelectedMethod(e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2"
                                            >
                                                <option value="">เลือกวิธีชำระเงิน</option>
                                                <option value="bank_transfer">โอนผ่านธนาคาร</option>
                                                <option value="credit_card">บัตรเครดิต</option>
                                            </select>
                                            {selectedMethod === 'bank_transfer' && (
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setPaymentProof(e.target.files[0])}
                                                    className="w-full p-2 border border-gray-200 rounded-lg mb-2"
                                                />
                                            )}
                                            <button
                                                onClick={() => handlePayment(order.id)}
                                                className="w-full p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                            >
                                                ชำระเงิน
                                            </button>
                                            <button
                                                onClick={() => handleCancelOrder(order.id)}
                                                className="w-full p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                            >
                                                ยกเลิกคำสั่งซื้อ
                                            </button>
                                        </>
                                    )}
                                    {order.status === 'shipped' && (
                                        <button
                                            onClick={() => handleConfirmDelivery(order.id)}
                                            className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                        >
                                            ยืนยันรับสินค้า
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Orders;