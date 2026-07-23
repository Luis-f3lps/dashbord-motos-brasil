const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/api/motos', (req, res) => {
    const caminhoArquivo = path.join(__dirname, 'dados.json');

    fs.readFile(caminhoArquivo, 'utf8', (err, data) => {
        if (err) {
            console.error("Erro ao ler o arquivo dados.json:", err);
            return res.status(500).json({ erro: "Erro ao carregar a base de dados." });
        }
        
        try {
            const jsonMotos = JSON.parse(data);
            res.json(jsonMotos);
        } catch (parseErro) {
            console.error("Erro de formatação no dados.json:", parseErro);
            res.status(500).json({ erro: "Arquivo JSON mal formatado." });
        }
    });
});

module.exports = app;