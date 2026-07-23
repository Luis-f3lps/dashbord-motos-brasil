let dadosDetalhados = [];
let dadosTotais = [];

let graficoTipoMes, graficoEvolucaoPercentual, graficoVendasFabricanteTotais, graficoModelosMesAno;
function limparNumero(valor) {
    if (!valor) return 0;
    return Number(String(valor).replace(/[^0-9.-]+/g,"")) || 0;
}
const coresFabricantes = {
    'HONDA': '#ff0000',          // Vermelho
    'YAMAHA': '#0000ff',         // Azul
    'KAWASAKI': '#32cd32',       // Verde-limão
    'SUZUKI': '#87ceeb',         // Azul-claro
    'DUCATI': '#8b0000',         // Vermelho-escuro
    'H.DAVIDSON': '#000000',     // Preto
    'BMW': '#1e293b',            // Escuro corporativo
    'TRIUMPH': '#006400',        // Verde-escuro
    'KTM': '#ff8c00',            // Laranja
    'ROYAL ENFIELD': '#8b4513',  // Marrom
    'SHINERAY': '#ff69b4',       // Rosa
    'MOTTU': '#008000',          // Verde
    'AVELLOZ': '#d97706',        // Amarelo escurecido
    'BAJAJ': '#64748b',          // Prata/Cinza escuro
    'HAOJUE': '#800080',         // Roxo
    'OUTROS': '#64748b'          // Cinza
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
        
        const selectTipoSec1 = document.getElementById('filtroTipoSec1');
        if (selectTipoSec1) selectTipoSec1.value = "City";

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

// 1. AJUSTE NA FUNÇÃO DE POPULAR FILTROS (Para identificar todos os anos disponíveis)
function popularFiltrosIniciais() {
    const preencherSelect = (idSelect, valores) => {
        const select = document.getElementById(idSelect);
        if (!select) return;
        const primeiraOpcao = select.options[0] ? select.options[0].outerHTML : '';
        select.innerHTML = primeiraOpcao;
        valores.filter(Boolean).forEach(valor => {
            select.innerHTML += `<option value="${valor}">${valor}</option>`;
        });
    };

    const datasDet = [...new Set(dadosDetalhados.map(d => d['Mês/Ano']))];
    const datasTot = [...new Set(dadosTotais.map(d => d['Mês/Ano']))];
    const datasUnicas = [...new Set([...datasDet, ...datasTot])].sort((a, b) => {
        const [mA, aA] = a.split('/'); const [mB, aB] = b.split('/');
        return new Date(aA, mA - 1) - new Date(aB, mB - 1);
    });

    // Extrai automaticamente os Anos únicos (ex: 2024, 2025, 2026)
    const anosUnicos = [...new Set(datasUnicas.map(d => d.split('/')[1]))].filter(Boolean).sort();
    const opcoesAnos = anosUnicos.map(ano => `Ano Todo (${ano})`);

    // Junta as opções de "Ano Todo" com os meses específicos
    const opcoesPeriodo = [...opcoesAnos, ...datasUnicas];

    preencherSelect('filtroTipoSec1', [...new Set(dadosDetalhados.map(d => d['Tipo']))].sort());
    preencherSelect('filtroDataSec1', datasUnicas);
    preencherSelect('filtroDataInicio', datasUnicas);
    preencherSelect('filtroDataFim', datasUnicas);
    preencherSelect('filtroPeriodoFabricante', opcoesPeriodo);
    
    // Alimenta a Seção 4
    preencherSelect('filtroModeloMesAno', opcoesPeriodo);
}


// 2. AJUSTE NO FILTRO DO DASHBOARD (Para saber o que filtrar)
function atualizarDashboard() {
    // ... (seu código anterior das seções 1, 2 e 3 mantém igual) ...

    // --- SEÇÃO 4: Filtro Inteligente de Modelos ---
    const periodoMod = document.getElementById('filtroModeloMesAno').value;
    let dadosModeloFiltrados = dadosDetalhados;

    if (periodoMod.startsWith('Ano Todo')) {
        // Extrai o ano dentro dos parênteses. Ex: "Ano Todo (2024)" -> "2024"
        const anoSelecionado = periodoMod.match(/\((.*?)\)/)[1];
        dadosModeloFiltrados = dadosDetalhados.filter(d => d['Mês/Ano'] && d['Mês/Ano'].endsWith(`/${anoSelecionado}`));
    } else if (periodoMod !== "") {
        // Se escolheu um mês específico (Ex: "06/2024")
        dadosModeloFiltrados = dadosDetalhados.filter(d => d['Mês/Ano'] === periodoMod);
    }
    // Se for "" (vazio), ele passa todos os dados (Soma Todo o Período)

    renderizarModelosMesAno(dadosModeloFiltrados);

    document.getElementById('contadorRegistros').innerText = `Dashboard atualizado com sucesso.`;
}


// 3. A FUNÇÃO DO GRÁFICO DA SEÇÃO 4 COM CONVERSÃO DE NÚMEROS CORRIGIDA
function renderizarModelosMesAno(dados) {
    const el = document.getElementById('graficoModelosMesAno');
    if (graficoModelosMesAno) graficoModelosMesAno.destroy();

    // Agrupa todos os modelos independentemente do tipo, CORRIGINDO AS ASPAS COM Number()
    const agrupado = dados.reduce((acc, item) => {
        const mod = `${item['Marca']} ${item['Modelo']}`;
        
        // CORREÇÃO CRÍTICA AQUI: Usamos Number() para garantir soma matemática verdadeira
        const quantidade = Number(item['Quantidade Vendida']) || 0; 
        
        if (!acc[mod]) {
            acc[mod] = { qtd: 0, marca: item['Marca'] };
        }
        
        acc[mod].qtd += quantidade; // Agora soma números: 37 + 100269 (Sem risco de concatenar texto!)
        return acc;
    }, {});

    // Ordena do maior para o menor (Top 15 mais vendidos no período filtrado)
    const ordenado = Object.entries(agrupado).sort((a, b) => b[1].qtd - a[1].qtd).slice(0, 15);
    
    const labels = ordenado.map(x => x[0]);
    const valores = ordenado.map(x => x[1].qtd);
    const cores = ordenado.map(x => obterCorFabricante(x[1].marca));

    graficoModelosMesAno = new Chart(el, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ 
                label: 'Quantidade Vendida (Soma Real)', 
                data: valores, 
                backgroundColor: cores 
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            indexAxis: 'y', // Deixa em barras horizontais (ótimo para ler nomes de modelos)
            plugins: {
                legend: { display: false }
            }
        }
    });
}
function obterTop10ComOutros(dados, chaveFab, chaveQtd) {
    const somatorio = {};
    dados.forEach(item => {
        const fab = item[chaveFab] || 'Outros';
        // AQUI: Usando limparNumero para garantir soma matemática sem erro de texto
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

    const agrupado = dados.reduce((acc, item) => {
        const chave = `${item['Marca']} - ${item['Modelo']}`;
        // AQUI: Protegendo a soma do gráfico de rosca contra textos com aspas
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

    if (dados.length === 0) {
        containerLista.innerHTML = `<p style="color: #888;">Nenhum registro encontrado.</p>`;
        return;
    }

    let htmlLista = '';
    dados.forEach(item => {
        const corMarca = obterCorFabricante(item['Marca']);
        // Limpando também na exibição visual da lista ao lado do gráfico
        const qtdLimpa = limparNumero(item['Quantidade Vendida']);
        htmlLista += `
            <div class="moto-item">
                <strong style="color: ${corMarca};">${item['Marca']}</strong> <strong>${item['Modelo']}</strong><br>
                Tipo: ${item['Tipo']} | Mês/Ano: ${item['Mês/Ano']}<br>
                <strong>Qtd Vendida:</strong> ${qtdLimpa}
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

    const totalFabPeriodo = {};
    dadosFiltradosIntervalo.forEach(d => {
        // AQUI: Protegendo o cálculo das linhas de evolução percentual
        totalFabPeriodo[d['Fabricante']] = (totalFabPeriodo[d['Fabricante']] || 0) + limparNumero(d['Quantidade Vendida']);
    });
    const top10Periodo = Object.entries(totalFabPeriodo).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0]);
    const fabricantesDataset = [...top10Periodo, 'Outros'];

    const datasets = fabricantesDataset.map((fab) => {
        const dataPoint = mesesFiltrados.map(mes => {
            const regMes = dadosFiltradosIntervalo.filter(d => d['Mês/Ano'] === mes);
            // AQUI: Somando com limparNumero()
            const totalMes = regMes.reduce((sum, r) => sum + limparNumero(r['Quantidade Vendida']), 0) || 1;
            
            let qtdFab = 0;
            if (fab === 'Outros') {
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

