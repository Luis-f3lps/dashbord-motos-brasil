# Dashboard de Vendas de Motos | Análise de Mercado

![Status](https://img.shields.io/badge/status-ativo-success)
![Tecnologia](https://img.shields.io/badge/tech-HTML5%20%7C%20CSS3%20%7C%20JS%20%7C%20Node-yellow)
![Dados](https://img.shields.io/badge/dados-JSON-blueviolet)
![Licença](https://img.shields.io/badge/license-MIT-lightgrey)

Este repositório contém o código-fonte do **Dashboard de Vendas de Motos**, uma ferramenta visual desenvolvida para centralizar, analisar e democratizar o acesso aos dados comerciais e métricas de emplacamento de motocicletas.

O sistema processa uma base de dados estruturada, transformando registros de vendas em gráficos interativos e indicadores estratégicos para tomada de decisão no mercado automobilístico.

## 🎯 Objetivo do Dashboard

* **Centralizar** o acervo de vendas do setor em uma interface única, amigável e responsiva.
* **Monitorar** a evolução das vendas e o *market share* através de indicadores visuais (evolução anual, fabricantes, etc.).
* **Reconhecer** as preferências do consumidor, destacando os tipos de motores e modelos com maior saída.
* **Facilitar** a busca por recortes específicos de mercado através de filtros inteligentes por fabricante, tipo, motor e data.

## 📊 Funcionalidades e Insights

O painel oferece uma visão macro e micro dos dados comerciais:

* **📈 Evolução Temporal:** Gráfico de linha demonstrando a porcentagem de mercado (tendência de vendas) por marca ao longo dos anos.
* **🏢 Fabricantes:** Gráfico de rosca categorizando o volume total de vendas por marca (Honda, Yamaha, Mottu, etc.).
* **⚙️ Tipo de Motor:** Distribuição de vendas comparando motores a combustão (Gasolina) e alternativas (Elétrica).
* **🏍️ Top Modelos:** Visualização detalhada das fatias de mercado por modelos específicos de motos.
* **🔍 Busca e Filtros Ativos:** Painel com filtros em tempo real interligados aos gráficos.

## 🛠️ Tecnologias Utilizadas

O projeto foi construído focado em leveza, performance e facilidade de hospedagem serverless:

* **HTML5 & CSS3:** Estrutura semântica e layout responsivo (Grid/Flexbox) com Dark Mode.
* **JavaScript (Vanilla):** Lógica de manipulação do DOM e recálculo dinâmico dos dados.
* **Chart.js:** Biblioteca para renderização dos gráficos interativos.
* **Node.js & Express:** Servidor backend para disponibilização da API de leitura dos dados.

## 📂 Estrutura do Projeto

```text
/
├── public/
│   ├── index.html      # Estrutura principal do dashboard
│   ├── css/
│   │   └── style2.css  # Estilização, temas e responsividade
│   └── js/
│       └── index.js    # Lógica de renderização dos gráficos e busca
├── src/
│   ├── dados.json      # Base de dados estática (JSON)
│   └── app.js          # Configuração do Express e API
├── package.json        # Dependências do Node
└── vercel.json         # Configuração de deploy (Serverless)