import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import PetList from './components/PetList';
import PetForm from './components/PetForm';
import PetDetail from './components/PetDetail';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import Favorites from './components/Favorites';
import PublicProfile from './components/PublicProfile';
import Orders from './components/Orders';
import SellerOrders from './components/SellerOrders';
import Cart from './components/Cart';
import AdminDashboard from './components/AdminDashboard';

const AuthContext = React.createContext();

function App() {
    const [pets, setPets] = useState([]);
    const [filteredPets, setFilteredPets] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // กำหนด applyFilters ก่อน fetchPets
    const applyFilters = useCallback((petList) => {
        let filtered = [...petList];
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(
                pet => pet.name.toLowerCase().includes(lowerQuery) || pet.type.toLowerCase().includes(lowerQuery)
            );
        }
        if (categoryFilter) {
            filtered = filtered.filter(pet => pet.category.toLowerCase() === categoryFilter.toLowerCase());
        }
        setFilteredPets(filtered);
    }, [searchQuery, categoryFilter]);

    const fetchPets = useCallback(async () => {
        try {
            const response = await axios.get('${process.env.REACT_APP_API_URL}/api/pets');
            setPets(response.data);
            applyFilters(response.data); // เรียกใช้หลังกำหนด
        } catch (error) {
            console.error('Error fetching pets:', error);
        }
    }, [applyFilters]);

    useEffect(() => {
        fetchPets();
        const token = localStorage.getItem('token');
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (token && storedUser) {
            setUser({ token, id: storedUser.id, username: storedUser.username });
        }
    }, [fetchPets]);

    useEffect(() => {
        if (location.state?.refresh) {
            fetchPets();
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, fetchPets, navigate, location.pathname]);

    const addPet = (newPet) => {
        setPets(prevPets => [...prevPets, newPet]);
        applyFilters([...pets, newPet]);
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        applyFilters(pets);
    };

    const handleCategoryFilter = (e) => {
        setCategoryFilter(e.target.value);
        applyFilters(pets);
    };

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser({ token, id: userData.id, username: userData.username });
        navigate('/');
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            <div className="min-h-screen bg-gray-50">
                <header className="bg-gradient-to-r from-sky-600 to-sky-800 text-white shadow-lg sticky top-0 z-20">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center justify-between w-full sm:w-auto">
                            <Link to="/" className="flex items-center gap-2">
                                <span className="text-xl sm:text-2xl font-bold tracking-tight">Pet Market</span>
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </Link>
                            <button 
                                className="sm:hidden text-white focus:outline-none" 
                                onClick={toggleMenu}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                                </svg>
                            </button>
                        </div>
                        <div className="w-full sm:flex-1 sm:max-w-md mx-0 sm:mx-4 flex gap-2 sm:gap-4">
                            <input
                                type="text"
                                placeholder="ค้นหาสัตว์เลี้ยง..."
                                value={searchQuery}
                                onChange={handleSearch}
                                className="w-full sm:flex-1 p-2 sm:p-3 rounded-lg bg-white text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-sm placeholder-gray-400 text-sm sm:text-base"
                            />
                            <select
                                value={categoryFilter}
                                onChange={handleCategoryFilter}
                                className="w-24 sm:w-32 p-2 sm:p-3 rounded-lg bg-white text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-sm text-sm sm:text-base"
                            >
                                <option value="">ทุกหมวดหมู่</option>
                                <option value="สุนัข">สุนัข</option>
                                <option value="แมว">แมว</option>
                                <option value="นก">นก</option>
                                <option value="ปลา">ปลา</option>
                                <option value="อื่นๆ">อื่นๆ</option>
                            </select>
                        </div>
                        <nav className={`w-full sm:w-auto ${isMenuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row items-center gap-3 sm:gap-6 mt-3 sm:mt-0`}>
                            {user ? (
                                <>
                                    <Link to="/profile" className="text-white hover:text-sky-200 transition text-sm sm:text-base" onClick={() => setIsMenuOpen(false)}>โปรไฟล์</Link>
                                    <Link to="/favorites" className="text-white hover:text-sky-200 transition text-sm sm:text-base" onClick={() => setIsMenuOpen(false)}>รายการโปรด</Link>
                                    <Link to="/cart" className="text-white hover:text-sky-200 transition text-sm sm:text-base" onClick={() => setIsMenuOpen(false)}>ตะกร้า</Link>
                                    <Link to="/orders" className="text-white hover:text-sky-200 transition text-sm sm:text-base" onClick={() => setIsMenuOpen(false)}>คำสั่งซื้อ</Link>
                                    <Link to="/seller/orders" className="text-white hover:text-sky-200 transition text-sm sm:text-base" onClick={() => setIsMenuOpen(false)}>จัดการคำสั่งซื้อ</Link>
                                    {user.role === 'admin' && (
                                        <Link to="/admin" className="text-white hover:text-sky-200 transition text-sm sm:text-base" onClick={() => setIsMenuOpen(false)}>แอดมิน</Link>
                                    )}
                                    <Link to="/post" className="bg-sky-500 px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-sky-400 transition text-sm sm:text-base" onClick={() => setIsMenuOpen(false)}>ลงประกาศ</Link>
                                    <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-white hover:text-sky-200 transition text-sm sm:text-base">ออกจากระบบ</button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="text-white hover:text-sky-200 transition text-sm sm:text-base" onClick={() => setIsMenuOpen(false)}>ล็อกอิน</Link>
                                    <Link to="/signup" className="bg-sky-500 px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-sky-400 transition text-sm sm:text-base" onClick={() => setIsMenuOpen(false)}>สมัครสมาชิก</Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>
                <main className="max-w-7xl mx-auto px-4 py-8">
                    <Routes>
                        <Route path="/" element={<PetList pets={filteredPets} />} />
                        <Route path="/post" element={<PetForm onAddPet={addPet} />} />
                        <Route path="/pets/:id" element={<PetDetail />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/favorites" element={<Favorites />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/seller/orders" element={<SellerOrders />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/users/:id" element={<PublicProfile />} />
                        <Route path="/about" element={<div className="p-6 text-center text-gray-700">เกี่ยวกับ Pet Market</div>} />
                    </Routes>
                </main>
                <footer className="bg-sky-100 py-6 text-center text-gray-600">
                    <p>© 2025 Pet Trading Market. All rights reserved.</p>
                </footer>
            </div>
        </AuthContext.Provider>
    );
}

export default App;
export { AuthContext };