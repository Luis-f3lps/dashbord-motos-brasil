let dadosOriginais = [];
let graficoLinhaTendencia, graficoRoscaMarca, graficoRoscaMotor, graficoRoscaModelo;

const paletaCores = [
    '#00b894', '#0984e3', '#6c5ce7', '#e17055', '#fdcb6e', 
    '#00cec9', '#d63031', '#e84393', '#2d3436', '#b2bec3'
];

// Inicialização
window.onload = async () => {
    try {
        const resposta = await fetch('/api/motos');
        dadosOriginais = await resposta.json();
        
        popularFiltros();
        aplicarFiltros(); 
        
        document.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', aplicarFiltros);
        });
    } catch (erro) {
        console.error("Erro ao buscar dados:", erro);
    }
};

function popularFiltros() {
    const preencherSelect = (idSelect, chave) => {
        const select = document.getElementById(idSelect);
        if (!select) return;
        // Limpa opções anteriores mantendo a primeira (ex: "Todos os...")
        const primeiraOpcao = select.options[0] ? select.options[0].outerHTML : '';
        select.innerHTML = primeiraOpcao;

        const valoresUnicos = [...new Set(dadosOriginais.map(d => d[chave]))].filter(Boolean).sort();
        valoresUnicos.forEach(valor => {
            select.innerHTML += `<option value="${valor}">${valor}</option>`;
        });
    };

    preencherSelect('filtroFabricante', 'Marca');
    preencherSelect('filtroTipo', 'Tipo');
    preencherSelect('filtroMotor', 'Motor (Gasolina/Elétrica)');
    preencherSelect('filtroData', 'Mês/Ano');
}

function aplicarFiltros() {
    const fabricante = document.getElementById('filtroFabricante')?.value || "";
    const tipo = document.getElementById('filtroTipo')?.value || "";
    const motor = document.getElementById('filtroMotor')?.value || "";
    const data = document.getElementById('filtroData')?.value || "";

    const dadosFiltrados = dadosOriginais.filter(d => {
        return (fabricante === "" || d['Marca'] === fabricante) &&
               (tipo === "" || d['Tipo'] === tipo) &&
               (motor === "" || d['Motor (Gasolina/Elétrica)'] === motor) &&
               (data === "" || d['Mês/Ano'] === data);
    });

    const contador = document.getElementById('contadorRegistros');
    if (contador) {
        contador.innerText = `Mostrando dados de ${dadosFiltrados.length} registros.`;
    }
    
    atualizarGraficos(dadosFiltrados);
}

// Agrupador para Gráficos
function agruparVendasPor(dados, chave) {
    return dados.reduce((acc, item) => {
        const valor = item[chave] || 'N/A';
        acc[valor] = (acc[valor] || 0) + item['Quantidade Vendida'];
        return acc;
    }, {});
}

function processarDadosLinha(dados) {
    const vendasPorAno = {};
    const vendasTotaisPorAno = {};

    dados.forEach(item => {
        const partesData = item['Mês/Ano'] ? item['Mês/Ano'].split('/') : [];
        const ano = partesData[1] || '2025';
        const marca = item['Marca'] || 'Outros';
        const qtd = item['Quantidade Vendida'] || 0;

        if (!vendasPorAno[ano]) vendasPorAno[ano] = {};
        vendasPorAno[ano][marca] = (vendasPorAno[ano][marca] || 0) + qtd;
        vendasTotaisPorAno[ano] = (vendasTotaisPorAno[ano] || 0) + qtd;
    });

    const anosOrdenados = Object.keys(vendasPorAno).sort();
    const marcasUnicas = [...new Set(dados.map(d => d['Marca']))].filter(Boolean);
    
    const datasets = marcasUnicas.map((marca, index) => {
        const dataPoint = anosOrdenados.map(ano => {
            const vendaMarcaNoAno = vendasPorAno[ano][marca] || 0;
            const totalNoAno = vendasTotaisPorAno[ano] || 1; 
            return ((vendaMarcaNoAno / totalNoAno) * 100).toFixed(2);
        });

        return {
            label: marca,
            data: dataPoint,
            borderColor: paletaCores[index % paletaCores.length],
            backgroundColor: paletaCores[index % paletaCores.length],
            fill: false,
            tension: 0.3
        };
    });

    return { labels: anosOrdenados, datasets };
}

function atualizarGraficos(dados) {
    if (graficoLinhaTendencia) graficoLinhaTendencia.destroy();
    if (graficoRoscaMarca) graficoRoscaMarca.destroy();
    if (graficoRoscaMotor) graficoRoscaMotor.destroy();
    if (graficoRoscaModelo) graficoRoscaModelo.destroy();

    // 1. Gráfico de Linha (Evolução por Fabricante/Ano)
    const elLinha = document.getElementById('graficoLinhaTendencia');
    if (elLinha) {
        const dadosLinha = processarDadosLinha(dados);
        graficoLinhaTendencia = new Chart(elLinha, {
            type: 'line',
            data: dadosLinha,
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { title: { display: true, text: 'Porcentagem do Mercado (%)' }, beginAtZero: true } }
            }
        });
    }

    // Função auxiliar para criar gráficos circulares/rosca
    const criarRosca = (id, chave) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const agrupamento = agruparVendasPor(dados, chave);
        return new Chart(el, {
            type: 'doughnut',
            data: {
                labels: Object.keys(agrupamento),
                datasets: [{ data: Object.values(agrupamento), backgroundColor: paletaCores }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    };

    // 2. Gráfico de Vendas por Fabricante
    graficoRoscaMarca = criarRosca('graficoRoscaMarca', 'Marca');

    // 3. Gráfico de Vendas por Tipo de Motor
    graficoRoscaMotor = criarRosca('graficoRoscaMotor', 'Motor (Gasolina/Elétrica)');

    // 4. Gráfico de Vendas por Modelo
    graficoRoscaModelo = criarRosca('graficoRoscaModelo', 'Modelo');
}