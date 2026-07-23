let dadosDetalhados = [];
let dadosTotais = [];

let graficoTipoMes, graficoEvolucaoPercentual, graficoVendasFabricanteTotais, graficoModelosMesAno;

const paletaCores = [
    '#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#06b6d4', 
    '#ec4899', '#f59e0b', '#6366f1', '#14b8a6', '#64748b', '#94a3b8'
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
        
        // Define "City" por padrão
        const selectTipoSec1 = document.getElementById('filtroTipoSec1');
        if (selectTipoSec1) selectTipoSec1.value = "City";

        // Define o último mês/ano disponível por padrão na Seção 1
        const selectDataSec1 = document.getElementById('filtroDataSec1');
        if (selectDataSec1 && selectDataSec1.options.length > 1) {
            selectDataSec1.selectedIndex = selectDataSec1.options.length - 1;
        }

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

    // Opções especiais de período (Anos inteiros)
    const opcoesPeriodo = ['Ano Todo (2025)', 'Ano Todo (2026)', ...datasUnicasOrdenadas];

    preencherSelect('filtroTipoSec1', tipos);
    preencherSelect('filtroDataSec1', datasUnicasOrdenadas);
    preencherSelect('filtroDataInicio', datasUnicasOrdenadas);
    preencherSelect('filtroDataFim', datasUnicasOrdenadas);
    preencherSelect('filtroPeriodoFabricante', opcoesPeriodo);
    preencherSelect('filtroModeloMesAno', opcoesPeriodo);
}

function atualizarDashboard() {
    // 1. Seção Tipo + Mês/Ano (Padrão City e último mês)
    const tipoSec1 = document.getElementById('filtroTipoSec1').value || "City";
    const dataSec1 = document.getElementById('filtroDataSec1').value;
    
    const dadosSec1 = dadosDetalhados.filter(d => 
        (tipoSec1 === "" || d['Tipo'] === tipoSec1) && 
        (dataSec1 === "" || d['Mês/Ano'] === dataSec1)
    );
    renderizarSecaoTipoMes(dadosSec1);

    // 2. Seção Evolução Percentual (Top 10 + Outros) com intervalo
    const inicioIntervalo = document.getElementById('filtroDataInicio').value;
    const fimIntervalo = document.getElementById('filtroDataFim').value;
    renderizarEvolucaoPercentual(inicioIntervalo, fimIntervalo);

    // 3. Vendas por Fabricante (Totais - Top 10 + Outros) com suporte a Ano Todo
    const periodoFab = document.getElementById('filtroPeriodoFabricante').value;
    let dadosTotaisFiltrados = dadosTotais;
    if (periodoFab === 'Ano Todo (2025)') {
        dadosTotaisFiltrados = dadosTotais.filter(d => d['Mês/Ano'].endsWith('/2025'));
    } else if (periodoFab === 'Ano Todo (2026)') {
        dadosTotaisFiltrados = dadosTotais.filter(d => d['Mês/Ano'].endsWith('/2026'));
    } else if (periodoFab !== "") {
        dadosTotaisFiltrados = dadosTotais.filter(d => d['Mês/Ano'] === periodoFab);
    }
    renderizarVendasFabricanteTotais(dadosTotaisFiltrados);

    // 4. Modelos por Mês/Ano com suporte a Ano Todo
    const periodoMod = document.getElementById('filtroModeloMesAno').value;
    let dadosModeloFiltrados = dadosDetalhados;
    if (periodoMod === 'Ano Todo (2025)') {
        dadosModeloFiltrados = dadosDetalhados.filter(d => d['Mês/Ano'].endsWith('/2025'));
    } else if (periodoMod === 'Ano Todo (2026)') {
        dadosModeloFiltrados = dadosDetalhados.filter(d => d['Mês/Ano'].endsWith('/2026'));
    } else if (periodoMod !== "") {
        dadosModeloFiltrados = dadosDetalhados.filter(d => d['Mês/Ano'] === periodoMod);
    }
    renderizarModelosMesAno(dadosModeloFiltrados);

    document.getElementById('contadorRegistros').innerText = `Dashboard atualizado com sucesso.`;
}

// --- FUNÇÃO AUXILIAR: TOP 10 + OUTROS ---
function obterTop10ComOutros(dados, chaveFab, chaveQtd) {
    const somatorio = {};
    dados.forEach(item => {
        const fab = item[chaveFab] || 'Outros';
        somatorio[fab] = (somatorio[fab] || 0) + item[chaveQtd];
    });

    const ordenado = Object.entries(somatorio).sort((a, b) => b[1] - a[1]);
    if (ordenado.length <= 10) return Object.fromEntries(ordenado);

    const top10 = Object.fromEntries(ordenado.slice(0, 10));
    top10['Outros'] = ordenado.slice(10).reduce((acc, curr) => acc + curr[1], 0);
    return top10;
}

// --- RENDERIZADORES ---

function renderizarSecaoTipoMes(dados) {
    const elCanvas = document.getElementById('graficoTipoMes');
    const containerLista = document.getElementById('listaMotosSec1');
    
    if (graficoTipoMes) graficoTipoMes.destroy();

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

    if (dados.length === 0) {
        containerLista.innerHTML = `<p style="color: #888;">Nenhum registro encontrado.</p>`;
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

    const mesesUnicos = [...new Set(dadosTotais.map(d => d['Mês/Ano']))].sort((a, b) => {
        const [mA, aA] = a.split('/'); const [mB, aB] = b.split('/');
        return new Date(aA, mA - 1) - new Date(aB, mB - 1);
    });

    let mesesFiltrados = mesesUnicos;
    if (inicio !== "" || fim !== "") {
        const idxInicio = inicio !== "" ? mesesUnicos.indexOf(inicio) : 0;
        const idxFim = fim !== "" ? mesesUnicos.indexOf(fim) : mesesUnicos.length - 1;
        mesesFiltrados = mesesUnicos.slice(Math.min(idxInicio, idxFim), Math.max(idxInicio, idxFim) + 1);
    }

    const dadosFiltradosIntervalo = dadosTotais.filter(d => mesesFiltrados.includes(d['Mês/Ano']));

    // Top 10 fabricantes do período selecionado
    const totalFabPeriodo = {};
    dadosFiltradosIntervalo.forEach(d => {
        totalFabPeriodo[d['Fabricante']] = (totalFabPeriodo[d['Fabricante']] || 0) + d['Quantidade Vendida'];
    });
    const top10Periodo = Object.entries(totalFabPeriodo).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0]);
    const fabricantesDataset = [...top10Periodo, 'Outros'];

    const datasets = fabricantesDataset.map((fab, index) => {
        const dataPoint = mesesFiltrados.map(mes => {
            const regMes = dadosFiltradosIntervalo.filter(d => d['Mês/Ano'] === mes);
            const totalMes = regMes.reduce((sum, r) => sum + r['Quantidade Vendida'], 0) || 1;
            
            let qtdFab = 0;
            if (fab === 'Outros') {
                qtdFab = regMes.filter(r => !top10Periodo.includes(r['Fabricante'])).reduce((sum, r) => sum + r['Quantidade Vendida'], 0);
            } else {
                const regFab = regMes.find(r => r['Fabricante'] === fab);
                qtdFab = regFab ? regFab['Quantidade Vendida'] : 0;
            }
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
        data: { labels: mesesFiltrados, datasets },
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

    const agrupadoTop10 = obterTop10ComOutros(dados, 'Fabricante', 'Quantidade Vendida');

    graficoVendasFabricanteTotais = new Chart(el, {
        type: 'bar',
        data: {
            labels: Object.keys(agrupadoTop10),
            datasets: [{ label: 'Vendas Totais', data: Object.values(agrupadoTop10), backgroundColor: '#3b82f6' }]
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

    const ordenado = Object.entries(agrupado).sort((a, b) => b[1] - a[1]).slice(0, 10);

    graficoModelosMesAno = new Chart(el, {
        type: 'bar',
        data: {
            labels: ordenado.map(x => x[0]),
            datasets: [{ label: 'Quantidade Vendida', data: ordenado.map(x => x[1]), backgroundColor: '#10b981' }]
        },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' }
    });
}