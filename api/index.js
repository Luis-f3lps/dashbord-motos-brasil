const express = require('express');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Conexão Neon
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET;

// ==========================================
// 1. MIDDLEWARE DE PROTEÇÃO
// ==========================================

function Autenticado(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        if (req.originalUrl.startsWith('/api')) {
            return res.status(401).json({ error: "Não autorizado" });
        }
        return res.redirect('/login.html');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.session = { user: decoded };
        next();
    } catch (err) {
        res.clearCookie('token');
        return res.redirect('/login.html');
    }
}

// ==========================================
// 2. ROTA DE LOGIN 
// ==========================================
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const users = await sql`SELECT * FROM usuario WHERE email = ${email}`;
        if (users.length === 0) return res.status(401).json({ error: 'Credenciais inválidas' });

        const user = users[0];
        if (user.status === 'desativado') return res.status(403).json({ error: 'Usuário desativado.' });

        const match = await bcrypt.compare(senha, user.senha);
        if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });

        const token = jwt.sign({ email: user.email, tipo_usuario: user.tipo_usuario }, JWT_SECRET, { expiresIn: '8h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 8 * 60 * 60 * 1000,
            path: '/' 
        });

        res.json({ success: true, tipo_usuario: user.tipo_usuario });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/admin', Autenticado, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

app.get('/api/projetos', async (req, res) => {
    try {
        const projetos = await sql`SELECT * FROM projetos ORDER BY id DESC`;
        res.json(projetos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar projetos' });
    }
});

app.post('/api/projetos', Autenticado, async (req, res) => {
    try {
        const dados = req.body;
        if (Array.isArray(dados)) {
            for (const p of dados) {
                const inicio = p.vigencia_inicio || null;
                const termino = p.vigencia_termino || null;
                await sql`
                    INSERT INTO projetos (titulo, area, unidade, coordenador, email, tipo, formacao, carreira, vigencia_inicio, vigencia_termino, processo_sei, etica_seguranca)
                    VALUES (${p.titulo}, ${p.area}, ${p.unidade}, ${p.coordenador}, ${p.email}, ${p.tipo}, ${p.formacao}, ${p.carreira}, ${inicio}, ${termino}, ${p.processo_sei}, ${p.etica_seguranca})
                `;
            }
            return res.status(201).json({ message: `${dados.length} projetos importados!` });
        } else {
            const { titulo, area, unidade, coordenador, email, tipo, formacao, carreira, vigencia_inicio, vigencia_termino, processo_sei, etica_seguranca } = dados;
            const inicio = vigencia_inicio || null;
            const termino = vigencia_termino || null;
            await sql`
                INSERT INTO projetos (titulo, area, unidade, coordenador, email, tipo, formacao, carreira, vigencia_inicio, vigencia_termino, processo_sei, etica_seguranca)
                VALUES (${titulo}, ${area}, ${unidade}, ${coordenador}, ${email}, ${tipo}, ${formacao}, ${carreira}, ${inicio}, ${termino}, ${processo_sei}, ${etica_seguranca})
            `;
            return res.status(201).json({ message: 'Projeto salvo!' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar no banco.' });
    }
});

app.delete('/api/projetos', Autenticado, async (req, res) => {
    try {
        const { id } = req.body;
        await sql`DELETE FROM projetos WHERE id = ${id}`;
        res.status(200).json({ message: 'Projeto apagado!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao apagar.' });
    }
});

// ==========================================
// ROTA PARA O AUTH-GUARD 
// ==========================================
app.get('/api/check-auth', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json({ Autenticado: false });

    try {
        jwt.verify(token, JWT_SECRET);
        res.json({ Autenticado: true });
    } catch (err) {
        res.json({ Autenticado: false });
    }
});

// ==========================================
// ROTA DE LOGOUT 
// ==========================================
app.get('/api/logout', (req, res) => {
    res.clearCookie('token', { path: '/' });
    res.json({ message: 'Logout efetuado com sucesso' });
});

module.exports = app;