const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// Render uchun portni sozlash
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); 
app.use(express.json()); 

// Ma'lumotlar saqlanadigan fayl
const filePath = path.join(__dirname, 'questions.json');

// Ma'lumotlarni o'qish funksiyasi
const readData = () => {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([]));
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data || "[]");
    } catch (error) {
        console.error("Faylni o'qishda xato:", error);
        return [];
    }
};

// 1. GET - Barcha misollarni olish
app.get('/api/questions', (req, res) => {
    const questions = readData();
    res.json(questions);
});

// 2. POST - Yangi misol qo'shish (Level bilan birga)
app.post('/api/questions', (req, res) => {
    // Front-enddan kelayotgan levelni ham qabul qilamiz
    const { qText, ans, level } = req.body;
    
    if (!qText || ans === undefined) {
        return res.status(400).json({ error: "Misol matni va javob bo'lishi shart!" });
    }

    const questions = readData();
    const newQuestion = {
        id: Date.now(),
        qText: qText,
        ans: ans.toString(), // Matematik xatolik bo'lmasligi uchun stringda saqlaymiz
        level: level || "Oson" // Agar daraja tanlanmasa, "Oson" bo'lib tushadi
    };
    
    questions.push(newQuestion);
    
    try {
        fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
        res.status(201).json(newQuestion);
    } catch (error) {
        res.status(500).json({ error: "Ma'lumotni saqlashda xato yuz berdi" });
    }
});

// 3. DELETE - Misolni o'chirish
app.delete('/api/questions/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let questions = readData();
    
    const initialLength = questions.length;
    questions = questions.filter(q => q.id !== id);
    
    if (questions.length === initialLength) {
        return res.status(404).json({ error: "Bunday ID dagi misol topilmadi" });
    }

    try {
        fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
        res.json({ message: "Muvaffaqiyatli o'chirildi!" });
    } catch (error) {
        res.status(500).json({ error: "O'chirishda xato yuz berdi" });
    }
});

// Serverni tekshirish uchun bosh sahifa
app.get('/', (req, res) => {
    res.send('Math API is running perfectly with Level support! 🚀');
});

app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishlamoqda...`);
});