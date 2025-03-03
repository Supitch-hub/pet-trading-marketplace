import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';

function PetForm({ onAddPet }) {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [category, setCategory] = useState(''); // เพิ่ม state สำหรับหมวดหมู่

    if (!user) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600">กรุณาล็อกอินเพื่อลงประกาศ</p>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        formData.append('type', type);
        formData.append('price', parseFloat(price));
        formData.append('description', description);
        formData.append('category', category); // เพิ่มหมวดหมู่
        if (image) formData.append('image', image);

        try {
            const response = await axios.post(
                'http://localhost:5000/api/pets',
                formData,
                { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' } }
            );
            onAddPet(response.data);
            navigate('/');
        } catch (error) {
            console.error('Error posting pet:', error.response?.data || error.message);
            alert('เกิดข้อผิดพลาดในการลงประกาศ');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-sky-800 mb-6">ลงประกาศขายสัตว์เลี้ยง</h2>
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="ชื่อสัตว์เลี้ยง"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                    type="text"
                    placeholder="ประเภท (เช่น พันธุ์)"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                    type="number"
                    placeholder="ราคา (บาท)"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                    onChange={(e) => setImage(e.target.files[0])}
                    className="w-full p-3 border border-gray-200 rounded-lg"
                />
                <textarea
                    placeholder="คำอธิบาย"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 h-32"
                />
                <button
                    type="submit"
                    className="w-full p-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition duration-200"
                >
                    ลงประกาศ
                </button>
            </div>
        </form>
    );
}

export default PetForm;