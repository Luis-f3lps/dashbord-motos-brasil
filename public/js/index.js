let dadosDetalhados = [];
let dadosTotais = [];

let graficoTipoMes, graficoEvolucaoPercentual, graficoVendasFabricanteTotais, graficoModelosMesAno;

function limparNumero(valor) {
    if (!valor) return 0;
    return Number(String(valor).replace(/[^0-9.-]+/g, "")) || 0;
}

function obterMesAno(item) {
    return item['Mês/Ano'] || item['Mês\\/Ano'] || "";
}

const coresFabricantes = {
    'HONDA': '#ff0000',
    'YAMAHA': '#0000ff',
    'KAWASAKI': '#32cd32',
    'SUZUKI': '#87ceeb',
    'DUCATI': '#8b0000',
    'H.DAVIDSON': '#000000',
    'BMW': '#1e293b',
    'TRIUMPH': '#006400',
    'KTM': '#ff8c00',
    'ROYAL ENFIELD': '#8b4513',
    'SHINERAY': '#ff69b4',
    'MOTTU': '#008000',
    'AVELLOZ': '#d97706',
    'BAJAJ': '#64748b',
    'HAOJUE': '#800080',
    'RESTO DO MERCADO': '#94a3b8',
    'OUTROS': '#64748b'
};

function obterCorFabricante(fabricante) {
    const fabUpper = (fabricante || '').toUpperCase();
    for (let chave in coresFabricantes) {
        if (fabUpper.includes(chave)) {
            return coresFabricantes[chave];
        }
    }
    return coresFabricantes['OUTROS'];
}

window.onload = async () => {
    try {
        const [respDetalhado, respTotais] = await Promise.all([
            fetch('/api/motos'),
            fetch('/api/totais')
        ]);

        dadosDetalhados = await respDetalhado.json();
        dadosTotais = await respTotais.json();
        
        popularFiltrosIniciais();
        
        // Define o Tipo padrão e seleciona o Mês MAIS RECENTE no primeiro select
        const selectTipoSec1 = document.getElementById('filtroTipoSec1');
        if (selectTipoSec1) selectTipoSec1.value = "City";

        const selectDataSec1 = document.getElementById('filtroDataSec1');
        if (selectDataSec1 && selectDataSec1.options.length > 1) {
            selectDataSec1.selectedIndex = 1; // Pega o primeiro mês (que agora é o mais recente!)
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
    const preencherSelect = (idSelect, valores, placeholder = "") => {
        const select = document.getElementById(idSelect);
        if (!select) return;
        const primeiraOpcao = select.options[0] ? select.options[0].outerHTML : (placeholder ? `<option value="">${placeholder}</option>` : '');
        select.innerHTML = primeiraOpcao;
        valores.filter(Boolean).forEach(valor => {
            select.innerHTML += `<option value="${valor}">${valor}</option>`;
        });
    };

    const datasDet = [...new Set(dadosDetalhados.map(d => obterMesAno(d)))];
    const datasTot = [...new Set(dadosTotais.map(d => obterMesAno(d)))];
    
    // ORDENAÇÃO DE MESES: Do mais novo (2026, 2025...) para o mais antigo (2021)
    const datasUnicasDecrescente = [...new Set([...datasDet, ...datasTot])].filter(Boolean).sort((a, b) => {
        const [mA, aA] = a.split('/'); const [mB, aB] = b.split('/');
        return new Date(aB, mB - 1) - new Date(aA, mA - 1);
    });

    // ORDENAÇÃO DE ANOS: Do mais recente para o antigo
    const anosUnicosDecrescente = [...new Set(datasUnicasDecrescente.map(d => d.split('/')[1]))].filter(Boolean).sort().reverse();
    const opcoesAnos = anosUnicosDecrescente.map(ano => `Ano Todo (${ano})`);
    
    // Opções gerais: Primeiro os Anos (do atual para trás), depois os Meses (do atual para trás)
    const opcoesPeriodo = [...opcoesAnos, ...datasUnicasDecrescente];

    // Popula todas as marcas para o select da Seção 2
    const marcasUnicas = [...new Set(dadosTotais.map(d => d['Fabricante']))].filter(Boolean).sort();

    preencherSelect('filtroTipoSec1', [...new Set(dadosDetalhados.map(d => d['Tipo']))].filter(Boolean).sort());
    preencherSelect('filtroDataSec1', datasUnicasDecrescente);
    preencherSelect('filtroDataInicio', datasUnicasDecrescente);
    preencherSelect('filtroDataFim', datasUnicasDecrescente);
    preencherSelect('filtroPeriodoFabricante', opcoesPeriodo);
    preencherSelect('filtroModeloMesAno', opcoesPeriodo);
    preencherSelect('filtroMarcaSec2', marcasUnicas);
}

function atualizarDashboard() {
    const tipoSec1 = document.getElementById('filtroTipoSec1').value || "";
    const dataSec1 = document.getElementById('filtroDataSec1').value || "";
    
    const dadosSec1 = dadosDetalhados.filter(d => {
        const condTipo = (tipoSec1 === "" || d['Tipo'] === tipoSec1);
        const condData = (dataSec1 === "" || obterMesAno(d) === dataSec1);
        return condTipo && condData;
    });
    renderizarSecaoTipoMes(dadosSec1);

    const inicioIntervalo = document.getElementById('filtroDataInicio').value;
    const fimIntervalo = document.getElementById('filtroDataFim').value;
    const marcaSec2 = document.getElementById('filtroMarcaSec2') ? document.getElementById('filtroMarcaSec2').value : "";
    renderizarEvolucaoPercentual(inicioIntervalo, fimIntervalo, marcaSec2);

    const periodoFab = document.getElementById('filtroPeriodoFabricante').value;
    let dadosTotaisFiltrados = dadosTotais;
    if (periodoFab.startsWith('Ano Todo')) {
        const anoSelecionado = periodoFab.match(/\((.*?)\)/)[1];
        dadosTotaisFiltrados = dadosTotais.filter(d => obterMesAno(d).endsWith(`/${anoSelecionado}`));
    } else if (periodoFab !== "") {
        dadosTotaisFiltrados = dadosTotais.filter(d => obterMesAno(d) === periodoFab);
    }
    renderizarVendasFabricanteTotais(dadosTotaisFiltrados);

    const periodoMod = document.getElementById('filtroModeloMesAno').value;
    let dadosModeloFiltrados = dadosDetalhados;
    if (periodoMod.startsWith('Ano Todo')) {
        const anoSelecionado = periodoMod.match(/\((.*?)\)/)[1];
        dadosModeloFiltrados = dadosDetalhados.filter(d => obterMesAno(d).endsWith(`/${anoSelecionado}`));
    } else if (periodoMod !== "") {
        dadosModeloFiltrados = dadosDetalhados.filter(d => obterMesAno(d) === periodoMod);
    }
    renderizarModelosMesAno(dadosModeloFiltrados);

    document.getElementById('contadorRegistros').innerText = `Dashboard atualizado com sucesso.`;
}

function obterTop10ComOutros(dados, chaveFab, chaveQtd) {
    const somatorio = {};
    dados.forEach(item => {
        const fab = item[chaveFab] || 'Outros';
        somatorio[fab] = (somatorio[fab] || 0) + limparNumero(item[chaveQtd]);
    });

    const ordenado = Object.entries(somatorio).sort((a, b) => b[1] - a[1]);
    if (ordenado.length <= 10) return Object.fromEntries(ordenado);

    const top10 = Object.fromEntries(ordenado.slice(0, 10));
    top10['Outros'] = ordenado.slice(10).reduce((acc, curr) => acc + curr[1], 0);
    return top10;
}

function renderizarSecaoTipoMes(dados) {
    const elCanvas = document.getElementById('graficoTipoMes');
    const containerLista = document.getElementById('listaMotosSec1');
    
    if (graficoTipoMes) graficoTipoMes.destroy();

    if (!dados || dados.length === 0) {
        if (elCanvas) {
            graficoTipoMes = new Chart(elCanvas, { type: 'doughnut', data: { labels: [], datasets: [] } });
        }
        containerLista.innerHTML = `<p style="color: #888; padding: 10px;">Nenhum registro encontrado para o filtro selecionado.</p>`;
        return;
    }

    const agrupado = dados.reduce((acc, item) => {
        const chave = `${item['Marca']} - ${item['Modelo']}`;
        acc[chave] = (acc[chave] || 0) + limparNumero(item['Quantidade Vendida']);
        return acc;
    }, {});

    const coresLabels = Object.keys(agrupado).map(chave => {
        const marca = chave.split(' - ')[0];
        return obterCorFabricante(marca);
    });

    graficoTipoMes = new Chart(elCanvas, {
        type: 'doughnut',
        data: {
            labels: Object.keys(agrupado),
            datasets: [{ data: Object.values(agrupado), backgroundColor: coresLabels }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    let htmlLista = '';
    dados.forEach(item => {
        const corMarca = obterCorFabricante(item['Marca']);
        const qtdLimpa = limparNumero(item['Quantidade Vendida']);
        htmlLista += `
            <div class="moto-item" style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                <strong style="color: ${corMarca};">${item['Marca']}</strong> <strong>${item['Modelo']}</strong><br>
                Tipo: ${item['Tipo']} | Mês/Ano: ${obterMesAno(item)}<br>
                <strong>Qtd Vendida:</strong> ${qtdLimpa.toLocaleString('pt-BR')}
            </div>
        `;
    });
    containerLista.innerHTML = htmlLista;
}

// SEÇÃO 2 ATUALIZADA: Gráfico com comparativo Marca vs Resto do Mercado
function renderizarEvolucaoPercentual(inicio, fim, marcaSelecionada = "") {
    const el = document.getElementById('graficoEvolucaoPercentual');
    if (graficoEvolucaoPercentual) graficoEvolucaoPercentual.destroy();

    // Como os meses no select estão decrescentes, no gráfico precisamos reverter para ordem CRONOLÓGICA (crescente)
    const mesesUnicos = [...new Set(dadosTotais.map(d => obterMesAno(d)))].filter(Boolean).sort((a, b) => {
        const [mA, aA] = a.split('/'); const [mB, aB] = b.split('/');
        return new Date(aA, mA - 1) - new Date(aB, mB - 1);
    });

    let mesesFiltrados = mesesUnicos;
    if (inicio !== "" || fim !== "") {
        const idx1 = inicio !== "" ? mesesUnicos.indexOf(inicio) : 0;
        const idx2 = fim !== "" ? mesesUnicos.indexOf(fim) : mesesUnicos.length - 1;
        const idxInicio = Math.min(idx1, idx2);
        const idxFim = Math.max(idx1, idx2);
        mesesFiltrados = mesesUnicos.slice(idxInicio, idxFim + 1);
    }

    const dadosFiltradosIntervalo = dadosTotais.filter(d => mesesFiltrados.includes(obterMesAno(d)));
    let fabricantesDataset = [];
    let top10Periodo = [];

    // SE O USUÁRIO ESCOLHEU UMA MARCA ESPECÍFICA:
    if (marcaSelecionada !== "") {
        fabricantesDataset = [marcaSelecionada, 'Resto do Mercado'];
    } else {
        // PADRÃO: TOP 10 + OUTROS
        const totalFabPeriodo = {};
        dadosFiltradosIntervalo.forEach(d => {
            totalFabPeriodo[d['Fabricante']] = (totalFabPeriodo[d['Fabricante']] || 0) + limparNumero(d['Quantidade Vendida']);
        });
        top10Periodo = Object.entries(totalFabPeriodo).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0]);
        fabricantesDataset = [...top10Periodo, 'Outros'];
    }

    const datasets = fabricantesDataset.map((fab) => {
        const dataPoint = mesesFiltrados.map(mes => {
            const regMes = dadosFiltradosIntervalo.filter(d => obterMesAno(d) === mes);
            const totalMes = regMes.reduce((sum, r) => sum + limparNumero(r['Quantidade Vendida']), 0) || 1;
            
            let qtdFab = 0;
            if (fab === 'Resto do Mercado') {
                qtdFab = regMes.filter(r => r['Fabricante'] !== marcaSelecionada).reduce((sum, r) => sum + limparNumero(r['Quantidade Vendida']), 0);
            } else if (fab === 'Outros') {
                qtdFab = regMes.filter(r => !top10Periodo.includes(r['Fabricante'])).reduce((sum, r) => sum + limparNumero(r['Quantidade Vendida']), 0);
            } else {
                const regFab = regMes.find(r => r['Fabricante'] === fab);
                qtdFab = regFab ? limparNumero(regFab['Quantidade Vendida']) : 0;
            }
            return ((qtdFab / totalMes) * 100).toFixed(2);
        });

        return {
            label: fab,
            data: dataPoint,
            borderColor: obterCorFabricante(fab),
            backgroundColor: obterCorFabricante(fab),
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
    const labels = Object.keys(agrupadoTop10);
    const valores = Object.values(agrupadoTop10);
    const cores = labels.map(fab => obterCorFabricante(fab));

    graficoVendasFabricanteTotais = new Chart(el, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: 'Vendas Totais', data: valores, backgroundColor: cores }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderizarModelosMesAno(dados) {
    const el = document.getElementById('graficoModelosMesAno');
    if (graficoModelosMesAno) graficoModelosMesAno.destroy();

    const agrupado = dados.reduce((acc, item) => {
        const mod = `${item['Marca']} ${item['Modelo']}`;
        const quantidade = limparNumero(item['Quantidade Vendida']); 
        
        if (!acc[mod]) {
            acc[mod] = { qtd: 0, marca: item['Marca'] };
        }
        
        acc[mod].qtd += quantidade; 
        return acc;
    }, {});

    const ordenado = Object.entries(agrupado).sort((a, b) => b[1].qtd - a[1].qtd).slice(0, 15);
    
    const labels = ordenado.map(x => x[0]);
    const valores = ordenado.map(x => x[1].qtd);
    const cores = ordenado.map(x => obterCorFabricante(x[1].marca));

    graficoModelosMesAno = new Chart(el, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ 
                label: 'Quantidade Vendida', 
                data: valores, 
                backgroundColor: cores 
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            indexAxis: 'y',
            plugins: {
                legend: { display: false }
            }
        }
    });
}