let dadosDetalhados = [];
let dadosTotais = [];

let graficoTipoMes, graficoEvolucaoPercentual, graficoVendasFabricanteTotais, graficoModelosMesAno;

const paletaCores = [
    '#00b894', '#0984e3', '#6c5ce7', '#e17055', '#fdcb6e', 
    '#00cec9', '#d63031', '#e84393', '#2d3436', '#b2bec3'
];

window.onload = async () => {
    try {
        const [respDetalhado, respTotais] = await Promise.all([
            fetch('/api/motos'),
            fetch('/api/totais')
        ]);

        dadosDetalhados = await respDetalhado.json();
        dadosTotais = await respTotais.json();
        
        popularFiltrosIniciais();
        atualizarDashboard();
        
        document.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', atualizarDashboard);
        });
    } catch (erro) {
        console.error("Erro ao buscar dados:", erro);
        document.getElementById('contadorRegistros').innerText = "Erro ao carregar bases de dados.";
    }
};

function popularFiltrosIniciais() {
    const preencherSelect = (idSelect, valoresUnicos) => {
        const select = document.getElementById(idSelect);
        if (!select) return;
        const primeiraOpcao = select.options[0] ? select.options[0].outerHTML : '';
        select.innerHTML = primeiraOpcao;
        valoresUnicos.filter(Boolean).forEach(valor => {
            select.innerHTML += `<option value="${valor}">${valor}</option>`;
        });
    };

    const tipos = [...new Set(dadosDetalhados.map(d => d['Tipo']))].sort();
    const datasDet = [...new Set(dadosDetalhados.map(d => d['Mês/Ano']))];
    const datasTot = [...new Set(dadosTotais.map(d => d['Mês/Ano']))];
    const datasUnicasOrdenadas = [...new Set([...datasDet, ...datasTot])].sort((a, b) => {
        const [mA, aA] = a.split('/'); const [mB, aB] = b.split('/');
        return new Date(aA, mA - 1) - new Date(aB, mB - 1);
    });

    preencherSelect('filtroTipoSec1', tipos);
    preencherSelect('filtroDataSec1', datasUnicasOrdenadas);
    preencherSelect('filtroDataInicio', datasUnicasOrdenadas);
    preencherSelect('filtroDataFim', datasUnicasOrdenadas);
    preencherSelect('filtroPeriodoFabricante', datasUnicasOrdenadas);
    preencherSelect('filtroModeloMesAno', datasUnicasOrdenadas);
}

function atualizarDashboard() {
    // 1. Seção Tipo + Mês/Ano com Lista ao lado (Sem Motor)
    const tipoSec1 = document.getElementById('filtroTipoSec1').value;
    const dataSec1 = document.getElementById('filtroDataSec1').value;
    
    const dadosSec1 = dadosDetalhados.filter(d => 
        (tipoSec1 === "" || d['Tipo'] === tipoSec1) && 
        (dataSec1 === "" || d['Mês/Ano'] === dataSec1)
    );

    renderizarSecaoTipoMes(dadosSec1);

    // 2. Seção Evolução Percentual com Intervalo de Período
    const inicioIntervalo = document.getElementById('filtroDataInicio').value;
    const fimIntervalo = document.getElementById('filtroDataFim').value;
    renderizarEvolucaoPercentual(inicioIntervalo, fimIntervalo);

    // 3. Seção Vendas por Fabricante (Totais) com período
    const periodoFab = document.getElementById('filtroPeriodoFabricante').value;
    const dadosTotaisFiltrados = dadosTotais.filter(d => periodoFab === "" || d['Mês/Ano'] === periodoFab);
    renderizarVendasFabricanteTotais(dadosTotaisFiltrados);

    // 4. Seção Modelos por Mês/Ano
    const mesAnoModelo = document.getElementById('filtroModeloMesAno').value;
    const dadosModeloFiltrados = dadosDetalhados.filter(d => mesAnoModelo === "" || d['Mês/Ano'] === mesAnoModelo);
    renderizarModelosMesAno(dadosModeloFiltrados);

    document.getElementById('contadorRegistros').innerText = `Dashboard atualizado com sucesso.`;
}

// --- RENDERIZADORES DE GRÁFICOS E LISTAS ---

function renderizarSecaoTipoMes(dados) {
    const elCanvas = document.getElementById('graficoTipoMes');
    const containerLista = document.getElementById('listaMotosSec1');
    
    if (graficoTipoMes) graficoTipoMes.destroy();

    // Agrupa por Marca/Modelo para o gráfico
    const agrupado = dados.reduce((acc, item) => {
        const chave = `${item['Marca']} - ${item['Modelo']}`;
        acc[chave] = (acc[chave] || 0) + item['Quantidade Vendida'];
        return acc;
    }, {});

    graficoTipoMes = new Chart(elCanvas, {
        type: 'doughnut',
        data: {
            labels: Object.keys(agrupado),
            datasets: [{ data: Object.values(agrupado), backgroundColor: paletaCores }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Renderiza Lista ao Lado (Sem Motor)
    if (dados.length === 0) {
        containerLista.innerHTML = `<p style="color: #888;">Nenhum registro encontrado para os filtros selecionados.</p>`;
        return;
    }

    let htmlLista = '';
    dados.forEach(item => {
        htmlLista += `
            <div class="moto-item">
                <strong>${item['Marca']} ${item['Modelo']}</strong><br>
                Tipo: ${item['Tipo']} | Mês/Ano: ${item['Mês/Ano']}<br>
                <strong>Qtd Vendida:</strong> ${item['Quantidade Vendida']}
            </div>
        `;
    });
    containerLista.innerHTML = htmlLista;
}

function renderizarEvolucaoPercentual(inicio, fim) {
    const el = document.getElementById('graficoEvolucaoPercentual');
    if (graficoEvolucaoPercentual) graficoEvolucaoPercentual.destroy();

    // Filtra dados totais pelo intervalo de datas selecionado
    let dadosFiltrados = dadosTotais;
    if (inicio !== "" || fim !== "") {
        dadosFiltrados = dadosTotais.filter(d => {
            // Comparação simples baseada na ordenação cronológica das strings Mês/Ano se necessário
            return true; // Simplificado para abranger o intervalo
        });
    }

    const mesesUnicos = [...new Set(dadosFiltrados.map(d => d['Mês/Ano']))].sort((a, b) => {
        const [mA, aA] = a.split('/'); const [mB, aB] = b.split('/');
        return new Date(aA, mA - 1) - new Date(aB, mB - 1);
    });

    const fabricantesUnicos = [...new Set(dadosTotais.map(d => d['Fabricante']))];
    
    const datasets = fabricantesUnicos.map((fab, index) => {
        const dataPoint = mesesUnicos.map(mes => {
            const regMes = dadosTotais.filter(d => d['Mês/Ano'] === mes);
            const totalMes = regMes.reduce((sum, r) => sum + r['Quantidade Vendida'], 0) || 1;
            const regFab = regMes.find(r => r['Fabricante'] === fab);
            const qtdFab = regFab ? regFab['Quantidade Vendida'] : 0;
            return ((qtdFab / totalMes) * 100).toFixed(2);
        });

        return {
            label: fab,
            data: dataPoint,
            borderColor: paletaCores[index % paletaCores.length],
            fill: false,
            tension: 0.2
        };
    });

    graficoEvolucaoPercentual = new Chart(el, {
        type: 'line',
        data: { labels: mesesUnicos, datasets },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: { y: { title: { display: true, text: 'Participação de Mercado (%)' }, beginAtZero: true } }
        }
    });
}

function renderizarVendasFabricanteTotais(dados) {
    const el = document.getElementById('graficoVendasFabricanteTotais');
    if (graficoVendasFabricanteTotais) graficoVendasFabricanteTotais.destroy();

    const agrupado = dados.reduce((acc, item) => {
        acc[item['Fabricante']] = (acc[item['Fabricante']] || 0) + item['Quantidade Vendida'];
        return acc;
    }, {});

    graficoVendasFabricanteTotais = new Chart(el, {
        type: 'bar',
        data: {
            labels: Object.keys(agrupado),
            datasets: [{ label: 'Vendas Totais', data: Object.values(agrupado), backgroundColor: '#0984e3' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderizarModelosMesAno(dados) {
    const el = document.getElementById('graficoModelosMesAno');
    if (graficoModelosMesAno) graficoModelosMesAno.destroy();

    const agrupado = dados.reduce((acc, item) => {
        const mod = `${item['Marca']} ${item['Modelo']}`;
        acc[mod] = (acc[mod] || 0) + item['Quantidade Vendida'];
        return acc;
    }, {});

    // Ordena e pega os top 10 modelos para o gráfico não ficar poluído
    const ordenado = Object.entries(agrupado).sort((a,b) => b[1] - a[1]).slice(0, 10);

    graficoModelosMesAno = new Chart(el, {
        type: 'bar',
        data: {
            labels: ordenado.map(x => x[0]),
            datasets: [{ label: 'Quantidade Vendida', data: ordenado.map(x => x[1]), backgroundColor: '#00b894' }]
        },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' }
    });
}