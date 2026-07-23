let dadosOriginais = [];
let graficoLinhaTendencia, graficoRoscaMarca, graficoRoscaMotor, graficoRoscaModelo;

const paletaCores = ['#00b894', '#0984e3', '#6c5ce7', '#e17055', '#fdcb6e', '#00cec9', '#d63031', '#e84393'];

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
        const valoresUnicos = [...new Set(dadosOriginais.map(d => d[chave]))].sort();
        valoresUnicos.forEach(valor => {
            if(valor) select.innerHTML += `<option value="${valor}">${valor}</option>`;
        });
    };

    preencherSelect('filtroMarca', 'Marca');
    preencherSelect('filtroTipo', 'Tipo');
    preencherSelect('filtroMotor', 'Motor (Gasolina/Elétrica)');
    preencherSelect('filtroData', 'Mês/Ano');
}

function aplicarFiltros() {
    const marca = document.getElementById('filtroMarca').value;
    const tipo = document.getElementById('filtroTipo').value;
    const motor = document.getElementById('filtroMotor').value;
    const data = document.getElementById('filtroData').value;

    const dadosFiltrados = dadosOriginais.filter(d => {
        return (marca === "" || d['Marca'] === marca) &&
               (tipo === "" || d['Tipo'] === tipo) &&
               (motor === "" || d['Motor (Gasolina/Elétrica)'] === motor) &&
               (data === "" || d['Mês/Ano'] === data);
    });

    document.getElementById('contadorRegistros').innerText = `Mostrando dados de ${dadosFiltrados.length} registros.`;
    atualizarGraficos(dadosFiltrados);
}

// Agrupador para Gráficos de Rosca
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
        const ano = item['Mês/Ano'].split('/')[1]; // Extrai o ano
        const marca = item['Marca'];
        const qtd = item['Quantidade Vendida'];

        if (!vendasPorAno[ano]) vendasPorAno[ano] = {};
        vendasPorAno[ano][marca] = (vendasPorAno[ano][marca] || 0) + qtd;
        vendasTotaisPorAno[ano] = (vendasTotaisPorAno[ano] || 0) + qtd;
    });

    const anosOrdenados = Object.keys(vendasPorAno).sort();
    const marcasUnicas = [...new Set(dados.map(d => d['Marca']))];
    
    const datasets = marcasUnicas.map((marca, index) => {
        const dataPoint = anosOrdenados.map(ano => {
            const vendaMarcaNoAno = vendasPorAno[ano][marca] || 0;
            const totalNoAno = vendasTotaisPorAno[ano] || 1; 
            return ((vendaMarcaNoAno / totalNoAno) * 100).toFixed(2); // Retorna a porcentagem
        });

        return {
            label: marca,
            data: dataPoint,
            borderColor: paletaCores[index % paletaCores.length],
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

    const dadosLinha = processarDadosLinha(dados);
    graficoLinhaTendencia = new Chart(document.getElementById('graficoLinhaTendencia'), {
        type: 'line',
        data: dadosLinha,
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { title: { display: true, text: 'Porcentagem do Mercado (%)' }, beginAtZero: true } }
        }
    });

    const criarRosca = (id, chave) => {
        const agrupamento = agruparVendasPor(dados, chave);
        return new Chart(document.getElementById(id), {
            type: 'doughnut',
            data: {
                labels: Object.keys(agrupamento),
                datasets: [{ data: Object.values(agrupamento), backgroundColor: paletaCores }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    };

    graficoRoscaMarca = criarRosca('graficoRoscaMarca', 'Marca');
    graficoRoscaMotor = criarRosca('graficoRoscaMotor', 'Motor (Gasolina/Elétrica)');
    graficoRoscaModelo = criarRosca('graficoRoscaModelo', 'Modelo');
}