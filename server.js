const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Para carregar variáveis de ambiente

const app = express();

app.use(cors()); // Isso libera o acesso para o seu HTML

app.use(express.json()); // Para o servidor entender JSON

// 1. CONEXÃO COM O BANCO (Use sua URL do MongoDB Atlas aqui)
const MONGO_URI = process.env.MONGO_URI || "sua_url_aqui";
const JWT_SECRET = process.env.JWT_SECRET || "chave_secreta_padrao";

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
    const user = await User.findById(req.userId).select('-password'); // Busca o user sem a senha
    res.json({ msg: "Bem-vindo à área VIP", user });
});

app.get('/', (req, res) => {
    res.send('O servidor de autenticação está rodando com sucesso!');
});

app.listen(3001, () => console.log("Servidor ativo na porta 3001"));
