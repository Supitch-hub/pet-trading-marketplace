const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const JWT_SECRET = 'mySuperSecretKey123!@#PetTrading2025';

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'กรุณาล็อกอิน' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'token ไม่ถูกต้อง' });
        req.user = user;
        next();
    });
};

// Signup (ปรับให้รับข้อมูลเพิ่มเติม)
app.post('/api/signup', async (req, res) => {
    const { username, email, password, bio, phone } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, email, password, bio, phone) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, bio || '', phone || '']
        );
        res.json({ id: result.insertId, username, email });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user profile
app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, email, bio, phone, profile_image, created_at FROM users WHERE id = ?', [req.user.id]);
        const [posts] = await db.query('SELECT * FROM pets WHERE user_id = ?', [req.user.id]);
        if (!users[0]) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        res.json({ user: users[0], posts });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: error.message });
    }
});
// Update user profile
app.put('/api/users/me', authenticateToken, upload.single('profile_image'), async (req, res) => {
    const { username, email, bio, phone } = req.body;
    const profile_image = req.file ? `/uploads/${req.file.filename}` : req.body.profile_image;
    console.log('Received data:', { username, email, bio, phone, profile_image }); // Log ข้อมูลที่ได้รับ
    try {
        const [result] = await db.query(
            'UPDATE users SET username = ?, email = ?, bio = ?, phone = ?, profile_image = ? WHERE id = ?',
            [username, email, bio, phone, profile_image, req.user.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        }
        res.json({ id: req.user.id, username, email, bio, phone, profile_image });
    } catch (error) {
        console.error('Error updating profile:', error); // Log error
        res.status(500).json({ error: error.message });
    }
});

// Get public profile (สำหรับดูโปรไฟล์คนอื่น)
app.get('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [users] = await db.query('SELECT id, username, bio, profile_image, created_at FROM users WHERE id = ?', [id]);
        const [posts] = await db.query('SELECT * FROM pets WHERE user_id = ?', [id]);
        if (!users[0]) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        res.json({ user: users[0], posts });
    } catch (error) {
        console.error('Error fetching public profile:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add to favorites
app.post('/api/favorites', authenticateToken, async (req, res) => {
    const { pet_id } = req.body;
    const user_id = req.user.id;
    try {
        const [result] = await db.query(
            'INSERT INTO favorites (user_id, pet_id) VALUES (?, ?)',
            [user_id, pet_id]
        );
        res.json({ id: result.insertId, user_id, pet_id });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'คุณกดชอบโพสต์นี้แล้ว' });
        }
        console.error('Error adding to favorites:', error);
        res.status(500).json({ error: error.message });
    }
});

// Remove from favorites
app.delete('/api/favorites/:pet_id', authenticateToken, async (req, res) => {
    const { pet_id } = req.params;
    const user_id = req.user.id;
    try {
        const [result] = await db.query(
            'DELETE FROM favorites WHERE user_id = ? AND pet_id = ?',
            [user_id, pet_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'ไม่พบรายการโปรดนี้' });
        }
        res.json({ message: 'ลบออกจากรายการโปรดสำเร็จ' });
    } catch (error) {
        console.error('Error removing from favorites:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user's favorites
app.get('/api/favorites', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    try {
        const [favorites] = await db.query(
            'SELECT p.* FROM pets p JOIN favorites f ON p.id = f.pet_id WHERE f.user_id = ?',
            [user_id]
        );
        res.json(favorites);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all pets (ปรับให้ส่ง category)
app.get('/api/pets', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT p.*, u.username FROM pets p JOIN users u ON p.user_id = u.id');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching pets:', error);
        res.status(500).json({ error: error.message });
    }
});


// Get pet details
app.get('/api/pets/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [pets] = await db.query('SELECT p.*, u.username FROM pets p JOIN users u ON p.user_id = u.id WHERE p.id = ?', [id]);
        const [reviews] = await db.query('SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.pet_id = ?', [id]);
        if (!pets[0]) return res.status(404).json({ error: 'ไม่พบสัตว์เลี้ยง' });
        res.json({ pet: pets[0], reviews });
    } catch (error) {
        console.error('Error fetching pet:', error);
        res.status(500).json({ error: error.message });
    }
});

// Post a pet (เพิ่ม category)
app.post('/api/pets', authenticateToken, upload.single('image'), async (req, res) => {
    const { name, type, price, description, category } = req.body;
    const user_id = req.user.id;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    try {
        const [result] = await db.query(
            'INSERT INTO pets (name, type, price, description, image_url, user_id, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, type, price, description, image_url, user_id, category || 'อื่นๆ']
        );
        res.json({ id: result.insertId, name, type, price, description, image_url, user_id, category });
    } catch (error) {
        console.error('Error posting pet:', error);
        res.status(500).json({ error: error.message });
    }
});
// Update a pet (เพิ่ม category)
app.put('/api/pets/:id', authenticateToken, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, type, price, description, category } = req.body;
    const user_id = req.user.id;
    const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url;
    try {
        const [pet] = await db.query('SELECT user_id FROM pets WHERE id = ?', [id]);
        if (!pet[0] || pet[0].user_id !== user_id) {
            return res.status(403).json({ error: 'คุณไม่มีสิทธิ์แก้ไขโพสต์นี้' });
        }
        await db.query(
            'UPDATE pets SET name = ?, type = ?, price = ?, description = ?, image_url = ?, category = ? WHERE id = ?',
            [name, type, price, description, image_url, category || 'อื่นๆ', id]
        );
        res.json({ id, name, type, price, description, image_url, user_id, category });
    } catch (error) {
        console.error('Error updating pet:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a pet (ต้องเป็นเจ้าของโพสต์)
app.delete('/api/pets/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;
    try {
        const [pet] = await db.query('SELECT user_id FROM pets WHERE id = ?', [id]);
        if (!pet[0] || pet[0].user_id !== user_id) {
            return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ลบโพสต์นี้' });
        }
        await db.query('DELETE FROM reviews WHERE pet_id = ?', [id]); // ลบรีวิวที่เกี่ยวข้อง
        await db.query('DELETE FROM pets WHERE id = ?', [id]);
        res.json({ message: 'ลบโพสต์สำเร็จ' });
    } catch (error) {
        console.error('Error deleting pet:', error);
        res.status(500).json({ error: error.message });
    }
});
app.put('/api/pets/:id', authenticateToken, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, type, price, description } = req.body;
    const user_id = req.user.id;
    const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url;
    try {
        const [pet] = await db.query('SELECT user_id FROM pets WHERE id = ?', [id]);
        if (!pet[0] || pet[0].user_id !== user_id) {
            return res.status(403).json({ error: 'คุณไม่มีสิทธิ์แก้ไขโพสต์นี้' });
        }
        await db.query(
            'UPDATE pets SET name = ?, type = ?, price = ?, description = ?, image_url = ? WHERE id = ?',
            [name, type, price, description, image_url, id]
        );
        res.json({ id, name, type, price, description, image_url, user_id });
    } catch (error) {
        console.error('Error updating pet:', error);
        res.status(500).json({ error: error.message });
    }
});
// Create an order
app.post('/api/orders', authenticateToken, async (req, res) => {
    const { pet_id } = req.body;
    const user_id = req.user.id;
    try {
        const [pet] = await db.query('SELECT price FROM pets WHERE id = ?', [pet_id]);
        if (!pet[0]) return res.status(404).json({ error: 'ไม่พบสัตว์เลี้ยง' });

        const [result] = await db.query(
            'INSERT INTO orders (user_id, pet_id) VALUES (?, ?)',
            [user_id, pet_id]
        );
        const orderId = result.insertId;

        await db.query(
            'INSERT INTO payments (order_id, amount, payment_method) VALUES (?, ?, ?)',
            [orderId, pet[0].price, 'pending']
        );

        res.json({ id: orderId, user_id, pet_id, status: 'pending', amount: pet[0].price });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: error.message });
    }
});
// Get user's orders (คำสั่งซื้อของผู้ซื้อ)
app.get('/api/orders', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    try {
        const [orders] = await db.query(
            'SELECT o.*, p.name, p.image_url, pay.amount, pay.payment_status FROM orders o JOIN pets p ON o.pet_id = p.id JOIN payments pay ON o.id = pay.order_id WHERE o.user_id = ?',
            [user_id]
        );
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get seller's pending orders (คำสั่งซื้อที่รอการยืนยันของผู้ขาย)
app.get('/api/seller/orders', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    console.log('Fetching seller orders for user_id:', user_id);
    try {
        const [orders] = await db.query(
            'SELECT o.*, u.username AS buyer_username, p.name, p.image_url, pay.amount, pay.payment_status, pay.payment_proof ' +
            'FROM orders o ' +
            'JOIN pets p ON o.pet_id = p.id ' +
            'JOIN users u ON o.user_id = u.id ' +
            'LEFT JOIN payments pay ON o.id = pay.order_id ' +
            'WHERE p.user_id = ? AND o.status IN ("pending", "confirmed", "awaiting_confirmation")',
            [user_id]
        );
        console.log('Orders fetched:', orders);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching seller orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// Confirm an order (ผู้ขายยืนยันคำสั่งซื้อ)
app.put('/api/orders/:id/confirm', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;
    try {
        const [order] = await db.query('SELECT pet_id FROM orders WHERE id = ?', [id]);
        if (!order[0]) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });

        const [pet] = await db.query('SELECT user_id FROM pets WHERE id = ?', [order[0].pet_id]);
        if (pet[0].user_id !== user_id) return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ยืนยันคำสั่งซื้อนี้' });

        await db.query('UPDATE orders SET status = "confirmed" WHERE id = ?', [id]);
        res.json({ message: 'ยืนยันคำสั่งซื้อสำเร็จ' });
    } catch (error) {
        console.error('Error confirming order:', error);
        res.status(500).json({ error: error.message });
    }
});
// Update payment status (จำลองการชำระเงินสำเร็จ)
app.put('/api/payments/:order_id', authenticateToken, async (req, res) => {
    const { order_id } = req.params;
    const { payment_method } = req.body; // เช่น 'credit_card', 'bank_transfer'
    try {
        const [order] = await db.query('SELECT user_id FROM orders WHERE id = ?', [order_id]);
        if (!order[0] || order[0].user_id !== req.user.id) return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ชำระเงินคำสั่งซื้อนี้' });

        await db.query(
            'UPDATE payments SET payment_status = "paid", payment_method = ? WHERE order_id = ?',
            [payment_method, order_id]
        );
        await db.query('UPDATE orders SET status = "completed" WHERE id = ?', [order_id]);
        res.json({ message: 'ชำระเงินสำเร็จ' });
    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({ error: error.message });
    }
});
// Checkout (สร้างคำสั่งซื้อสถานะ "pending_payment")
app.post('/api/checkout', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    try {
        const [cartItems] = await db.query(
            'SELECT c.pet_id, p.price, p.shipping_cost FROM cart c JOIN pets p ON c.pet_id = p.id WHERE c.user_id = ?',
            [user_id]
        );
        if (cartItems.length === 0) return res.status(400).json({ error: 'ตะกร้าว่างเปล่า' });

        const orders = [];
        for (const item of cartItems) {
            const [result] = await db.query(
                'INSERT INTO orders (user_id, pet_id, status) VALUES (?, ?, "pending_payment")', // เปลี่ยนจาก "pending" เป็น "pending_payment"
                [user_id, item.pet_id]
            );
            const orderId = result.insertId;
            const totalAmount = parseFloat(item.price) + parseFloat(item.shipping_cost);
            await db.query(
                'INSERT INTO payments (order_id, amount, payment_method, payment_status) VALUES (?, ?, "pending", "pending")',
                [orderId, totalAmount]
            );
            orders.push({ id: orderId, pet_id: item.pet_id, amount: totalAmount });
        }

        await db.query('DELETE FROM cart WHERE user_id = ?', [user_id]);
        res.json({ message: 'สั่งซื้อสำเร็จ กรุณาชำระเงิน', orders });
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update payment status (ผู้ซื้อชำระเงิน)
app.put('/api/payments/:order_id', authenticateToken, upload.single('payment_proof'), async (req, res) => {
    const { order_id } = req.params;
    const { payment_method } = req.body;
    const payment_proof = req.file ? `/uploads/${req.file.filename}` : null;
    console.log('Updating payment for order_id:', order_id, 'method:', payment_method, 'proof:', payment_proof);
    try {
        const [order] = await db.query('SELECT user_id, status FROM orders WHERE id = ?', [order_id]);
        if (!order[0] || order[0].user_id !== req.user.id) return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ชำระเงินคำสั่งซื้อนี้' });
        if (order[0].status !== 'pending_payment') return res.status(400).json({ error: 'คำสั่งซื้อนี้ไม่สามารถชำระเงินได้ในขณะนี้' });

        const paymentStatus = payment_method === 'bank_transfer' && payment_proof ? 'submitted' : 'paid';
        await db.query(
            'UPDATE payments SET payment_status = ?, payment_method = ?, payment_proof = ? WHERE order_id = ?',
            [paymentStatus, payment_method, payment_proof, order_id]
        );
        await db.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [paymentStatus === 'submitted' ? 'payment_submitted' : 'confirmed', order_id]
        );
        res.json({ message: paymentStatus === 'submitted' ? 'ส่งหลักฐานการชำระเงินสำเร็จ รอผู้ขายยืนยัน' : 'ชำระเงินสำเร็จ' });
    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Seller's orders (ดึงเฉพาะ "payment_submitted" และสถานะที่เกี่ยวข้อง)
app.get('/api/seller/orders', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    console.log('Fetching seller orders for user_id:', user_id);
    try {
        const [orders] = await db.query(
            'SELECT o.*, u.username AS buyer_username, p.name, p.image_url, pay.amount, pay.payment_status, pay.payment_proof ' +
            'FROM orders o ' +
            'JOIN pets p ON o.pet_id = p.id ' +
            'JOIN users u ON o.user_id = u.id ' +
            'LEFT JOIN payments pay ON o.id = pay.order_id ' +
            'WHERE p.user_id = ? AND o.status IN ("payment_submitted", "confirmed", "shipped")',
            [user_id]
        );
        console.log('Orders fetched:', orders);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching seller orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify payment proof (ผู้ขายยืนยันการชำระเงิน)
app.put('/api/payments/:order_id/verify', authenticateToken, async (req, res) => {
    const { order_id } = req.params;
    try {
        const [order] = await db.query('SELECT pet_id, status FROM orders WHERE id = ?', [order_id]);
        if (!order[0]) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
        if (order[0].status !== 'payment_submitted') return res.status(400).json({ error: 'คำสั่งซื้อนี้ไม่รอการตรวจสอบการชำระเงิน' });

        const [pet] = await db.query('SELECT user_id FROM pets WHERE id = ?', [order[0].pet_id]);
        if (pet[0].user_id !== req.user.id) return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ยืนยันการชำระเงินนี้' });

        await db.query(
            'UPDATE payments SET payment_status = "paid" WHERE order_id = ?',
            [order_id]
        );
        await db.query('UPDATE orders SET status = "confirmed" WHERE id = ?', [order_id]);
        res.json({ message: 'ยืนยันการชำระเงินสำเร็จ' });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Notify shipping
app.put('/api/orders/:id/shipped', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [order] = await db.query('SELECT pet_id, status FROM orders WHERE id = ?', [id]);
        if (!order[0]) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
        if (order[0].status !== 'confirmed') return res.status(400).json({ error: 'คำสั่งซื้อนี้ยังไม่พร้อมจัดส่ง' });

        const [pet] = await db.query('SELECT user_id FROM pets WHERE id = ?', [order[0].pet_id]);
        if (pet[0].user_id !== req.user.id) return res.status(403).json({ error: 'คุณไม่มีสิทธิ์แจ้งขนส่งคำสั่งซื้อนี้' });

        await db.query('UPDATE orders SET status = "shipped" WHERE id = ?', [id]);
        res.json({ message: 'แจ้งขนส่งสำเร็จ' });
    } catch (error) {
        console.error('Error notifying shipping:', error);
        res.status(500).json({ error: error.message });
    }
});
// Add to cart
app.post('/api/cart', authenticateToken, async (req, res) => {
    const { pet_id, quantity = 1 } = req.body;
    const user_id = req.user.id;
    try {
        const [pet] = await db.query('SELECT user_id FROM pets WHERE id = ?', [pet_id]);
        if (!pet[0]) return res.status(404).json({ error: 'ไม่พบสัตว์เลี้ยง' });
        if (pet[0].user_id === user_id) return res.status(403).json({ error: 'คุณไม่สามารถเพิ่มโพสต์ของตัวเองลงตะกร้าได้' });

        const [result] = await db.query(
            'INSERT INTO cart (user_id, pet_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?',
            [user_id, pet_id, quantity, quantity]
        );
        res.json({ id: result.insertId || pet_id, user_id, pet_id, quantity });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get cart items
app.get('/api/cart', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    try {
        const [items] = await db.query(
            'SELECT c.*, p.name, p.price, p.shipping_cost, p.image_url, p.category, p.type FROM cart c JOIN pets p ON c.pet_id = p.id WHERE c.user_id = ?',
            [user_id]
        );
        res.json(items);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: error.message });
    }
});

// Remove from cart
app.delete('/api/cart/:pet_id', authenticateToken, async (req, res) => {
    const { pet_id } = req.params;
    const user_id = req.user.id;
    try {
        const [result] = await db.query(
            'DELETE FROM cart WHERE user_id = ? AND pet_id = ?',
            [user_id, pet_id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบรายการในตะกร้า' });
        res.json({ message: 'ลบออกจากตะกร้าสำเร็จ' });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ error: error.message });
    }
});

// Checkout (สร้างคำสั่งซื้อจากตะกร้า)
app.post('/api/checkout', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    try {
        const [cartItems] = await db.query(
            'SELECT c.pet_id, p.price, p.shipping_cost FROM cart c JOIN pets p ON c.pet_id = p.id WHERE c.user_id = ?',
            [user_id]
        );
        if (cartItems.length === 0) return res.status(400).json({ error: 'ตะกร้าว่างเปล่า' });

        const orders = [];
        for (const item of cartItems) {
            const [result] = await db.query(
                'INSERT INTO orders (user_id, pet_id, status) VALUES (?, ?, "pending")',
                [user_id, item.pet_id]
            );
            const orderId = result.insertId;
            const totalAmount = parseFloat(item.price) + parseFloat(item.shipping_cost);
            await db.query(
                'INSERT INTO payments (order_id, amount, payment_method, payment_status) VALUES (?, ?, "pending", "pending")',
                [orderId, totalAmount]
            );
            orders.push({ id: orderId, pet_id: item.pet_id, amount: totalAmount });
        }

        await db.query('DELETE FROM cart WHERE user_id = ?', [user_id]); // ล้างตะกร้า
        res.json({ message: 'สั่งซื้อสำเร็จ', orders });
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).json({ error: error.message });
    }
});

// Confirm delivery (ลูกค้ายืนยันรับสินค้า)
app.put('/api/orders/:id/delivered', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;
    try {
        const [order] = await db.query('SELECT user_id FROM orders WHERE id = ?', [id]);
        if (!order[0] || order[0].user_id !== user_id) return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ยืนยันคำสั่งซื้อนี้' });

        await db.query('UPDATE orders SET status = "delivered" WHERE id = ?', [id]);
        const [payment] = await db.query('SELECT amount FROM payments WHERE order_id = ?', [id]);
        const commission = payment[0].amount * 0.1; // ค่าคอม 10%
        const sellerAmount = payment[0].amount - commission;

        // จำลองการโอนเงินให้ผู้ขายและแพลตฟอร์ม (ในระบบจริงต้องใช้ payment gateway)
        console.log(`Order ${id} completed: Seller gets ${sellerAmount}, Platform gets ${commission}`);
        await db.query('UPDATE orders SET status = "completed" WHERE id = ?', [id]);
        res.json({ message: 'ยืนยันรับสินค้าสำเร็จ' });
    } catch (error) {
        console.error('Error confirming delivery:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add a review (ต้องล็อกอิน)
app.post('/api/pets/:id/reviews', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user.id;
    try {
        const [result] = await db.query(
            'INSERT INTO reviews (pet_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
            [id, user_id, rating, comment]
        );
        res.json({ id: result.insertId, pet_id: id, user_id, rating, comment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Notify shipping (จำลองการแจ้งขนส่ง)
app.put('/api/orders/:id/shipped', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [order] = await db.query('SELECT pet_id FROM orders WHERE id = ?', [id]);
        if (!order[0]) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });

        const [pet] = await db.query('SELECT user_id FROM pets WHERE id = ?', [order[0].pet_id]);
        if (pet[0].user_id !== req.user.id) return res.status(403).json({ error: 'คุณไม่มีสิทธิ์แจ้งขนส่งคำสั่งซื้อนี้' });

        await db.query('UPDATE orders SET status = "shipped" WHERE id = ?', [id]);
        res.json({ message: 'แจ้งขนส่งสำเร็จ' });
    } catch (error) {
        console.error('Error notifying shipping:', error);
        res.status(500).json({ error: error.message });
    }
});
// Get all users (สำหรับแอดมิน)
app.get('/api/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึง' });
    try {
        const [users] = await db.query('SELECT id, username, email, role FROM users');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});
app.listen(5000, () => console.log('Server running on port 5000'));