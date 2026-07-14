const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DATA_FILE = './data.json';

// Initialize data
async function initData() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        const initialData = generateItems(150);
        await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
    }
}

function generateItems(count) {
    const banks = ['Chase', 'Bank of America', 'Wells Fargo', 'Citi', 'PNC', 'US Bank', 'Capital One', 'TD Bank', 'Navy Federal', 'Discover'];
    const states = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'IN', 'MO', 'TN', 'MD', 'WI', 'CO', 'MN', 'SC', 'AL', 'LA', 'KY', 'OR', 'OK', 'CT', 'UT'];
    const types = ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'];
    
    const items = [];
    for (let i = 0; i < count; i++) {
        const balance = Math.floor(Math.random() * (26000 - 2000 + 1)) + 2000;
        // Price is 0.5% to 2% of balance, min $15, max $100
        const percentage = 0.005 + (Math.random() * 0.015); // 0.5% to 2%
        let price = Math.floor(balance * percentage);
        price = Math.max(15, Math.min(price, 100)); // Clamp between 15-100
        
        items.push({
            id: Date.now() + i + Math.random().toString(36).substr(2, 9),
            bank: banks[Math.floor(Math.random() * banks.length)],
            type: types[Math.floor(Math.random() * types.length)],
            balance: balance,
            price: price,
            location: `${states[Math.floor(Math.random() * states.length)]}|${Math.floor(Math.random() * 90000) + 10000}`,
            security: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
            status: 'active',
            added: new Date().toISOString()
        });
    }
    return items;
}

// Routes
app.get('/api/items', async (req, res) => {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
});

app.post('/api/items', async (req, res) => {
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    const newItem = {
        ...req.body,
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        added: new Date().toISOString()
    };
    data.unshift(newItem);
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    res.json(newItem);
});

app.put('/api/items/:id', async (req, res) => {
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    const index = data.findIndex(i => i.id === req.params.id);
    if (index !== -1) {
        data[index] = { ...data[index], ...req.body };
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        res.json(data[index]);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.delete('/api/items/:id', async (req, res) => {
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    const filtered = data.filter(i => i.id !== req.params.id);
    await fs.writeFile(DATA_FILE, JSON.stringify(filtered, null, 2));
    res.json({ success: true });
});

app.post('/api/reset', async (req, res) => {
    const newData = generateItems(150);
    await fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2));
    res.json({ success: true, count: newData.length });
});

initData().then(() => {
    app.listen(3000, () => console.log('Server running on http://localhost:3000'));
});
