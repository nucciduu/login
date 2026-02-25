const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config(); // Para carregar variáveis de ambiente

const app = express();
// --- CONFIGURAÇÕES INICIAIS ---
app.use(cors()); // Isso libera o acesso para o seu HTML
app.use(express.json()); // Para o servidor entender JSON

// Serve os arquivos da pasta 'public' (seu index.html deve estar lá dentro)
app.use(express.static(path.join(__dirname, 'public')));

// 1. CONEXÃO COM O BANCO (Use sua URL do MongoDB Atlas aqui)
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect(MONGO_URI)
  .then(() => console.log("Conectado ao MongoDB!"))
  .catch(err => {
    console.error("=== ERRO DE CONEXÃO DETALHADO ===");
    console.error("Mensagem:", err.message);
    console.error("Código do Erro:", err.code);
    console.error("================================");
    });

// 2. MODELO DE USUÁRIO
const User = mongoose.model('User', new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }
}));


// Modelo de Produto
const Product = mongoose.model('Product', new mongoose.Schema({
    nome: String,
    preco: Number,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Dono do produto
}));

// 3. MIDDLEWARE DE SEGURANÇA (O "Segurança da Festa")
function verificarToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ msg: "Acesso negado. Faça login." });

    try {
        const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET); // Remove o "Bearer "
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(400).json({ msg: "Token inválido." });
    }
}

// 4. ROTA DE REGISTRO
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedSsenha = await bcrypt.hash(password, salt);

    try {
        const novoUser = new User({ email, password: hashedSsenha });
        await novoUser.save();
        res.status(201).json({ msg: "Usuário criado!" });
    } catch (err) {
        res.status(400).json({ msg: "E-mail já cadastrado." });
    }
});

// 5. ROTA DE LOGIN
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Usuário não encontrado." });

    const senhaOk = await bcrypt.compare(password, user.password);
    if (!senhaOk) return res.status(400).json({ msg: "Senha incorreta." });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
});

// 6. ROTA PROTEGIDA (Página VIP)
app.get('/perfil', verificarToken, async (req, res) => {
    try {
        // O Mongoose retorna o ID como _id por padrão
        const user = await User.findById(req.userId).select('-password');
        
        if (!user) return res.status(404).json({ msg: "Usuário não encontrado" });

        console.log("Usuário encontrado:", user); // Isso aparecerá no log do Render/Terminal
        res.json(user); 
    } catch (err) {
        res.status(500).json({ msg: "Erro ao buscar perfil" });
    }
});

// --- ROTA RAIZ (Garante que o index.html seja aberto no link do Render) ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



// Rota para Criar Produto
app.post('/products', verificarToken, async (req, res) => {
    const { nome, preco } = req.body;
    const novoProduto = new Product({ nome, preco, userId: req.userId });
    await novoProduto.save();
    res.json(novoProduto);
});

// Rota para Listar Produtos do Usuário (O nosso "RecyclerView")
app.get('/products', verificarToken, async (req, res) => {
    const produtos = await Product.find({ userId: req.userId });
    res.json(produtos);
});

// Rota para Deletar
app.delete('/products/:id', verificarToken, async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: "Removido!" });
});

// --- INICIALIZAÇÃO ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});




