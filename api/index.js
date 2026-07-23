const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.static(path.join(__dirname, '..', 'public')));

// Rota para dados detalhados (dados.json)
app.get('/api/motos', (req, res) => {
    const caminho = path.join(__dirname, 'dados.json');
    fs.readFile(caminho, 'utf8', (err, data) => {
        if (err) {
            console.error("Erro ao ler dados.json:", err);
            return res.status(500).json({ erro: "Erro ao ler dados.json" });
        }
        res.json(JSON.parse(data));
    });
});

// Rota para dados totais (dados-totais.json) -> ESSA FALTAVA OU ESTAVA COM 404
app.get('/api/totais', (req, res) => {
    const caminho = path.join(__dirname, 'dados-totais.json');
    fs.readFile(caminho, 'utf8', (err, data) => {
        if (err) {
            console.error("Erro ao ler dados-totais.json:", err);
            return res.status(500).json({ erro: "Erro ao ler dados-totais.json" });
        }
        res.json(JSON.parse(data));
    });
});

module.exports = app;