# Dashboard de Inovação e Pesquisa | IFNMG - Campus Salinas

![Status](https://img.shields.io/badge/status-ativo-success)
![Tecnologia](https://img.shields.io/badge/tech-HTML5%20%7C%20CSS3%20%7C%20JS-yellow)
![Dados](https://img.shields.io/badge/projetos-1000%2B-blueviolet)
![Licença](https://img.shields.io/badge/license-MIT-lightgrey)

Este repositório contém o código-fonte do **Dashboard de Inovação**, uma ferramenta visual desenvolvida para centralizar, analisar e democratizar o acesso aos dados da produção científica, tecnológica e de extensão do **Instituto Federal do Norte de Minas Gerais - Campus Salinas**.

O sistema processa uma base de dados histórica (2013-2025), transformando centenas de registros de projetos em gráficos interativos e indicadores estratégicos para tomada de decisão.

## 🎯 Objetivo do Dashboard

* **Centralizar** o acervo acadêmico do campus em uma interface única, amigável e responsiva.
* **Monitorar** a evolução da produção científica através de indicadores visuais (evolução anual, áreas do conhecimento, etc.).
* **Reconhecer** o trabalho dos pesquisadores, destacando os coordenadores e áreas com maior produtividade.
* **Facilitar** a busca por projetos específicos através de filtros inteligentes por nome, área ou coordenador.

## 📊 Funcionalidades e Insights

O painel oferece uma visão macro e micro dos dados institucionais:

* **📈 Evolução Temporal:** Gráfico de linha demonstrando o volume de projetos iniciados ano a ano.
* **🧠 Áreas do Conhecimento:** Gráfico de barras categorizando projetos por grandes áreas (Agrárias, Exatas, Humanas, etc.).
* **🏆 Top Coordenadores:** Ranking visual dos pesquisadores com maior volume de projetos registrados.
* **🎓 Nível de Formação:** Distribuição dos pesquisadores por titulação (Doutorado, Mestrado, Especialização).
* **🔍 Busca Ativa:** Lista de projetos com filtro em tempo real e cartões detalhados.

## 🛠️ Tecnologias Utilizadas

O projeto foi construído focado em leveza e performance, sem necessidade de frameworks pesados:

* **HTML5 & CSS3:** Estrutura semântica e layout responsivo (Grid/Flexbox).
* **JavaScript (Vanilla):** Lógica de manipulação do DOM e filtros de busca.
* **Chart.js:** Biblioteca para renderização dos gráficos interativos.
* **FontAwesome:** Ícones vetoriais para interface.

## 📂 Estrutura do Projeto

```text
/
├── index.html          # Estrutura principal do dashboard
├── css/
│   └── style2.css      # Estilização, temas e responsividade
├── js/
│   ├── dados.js        # Base de dados (JSON/Array de projetos)
│   └── index.js        # Lógica de renderização dos gráficos e busca
└── images/             # Logos e assets visuais