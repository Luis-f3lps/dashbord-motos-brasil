let dadosOriginais = [];
let graficoLinhaMensal, graficoBarraAnual, graficoRoscaMotor;

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
    const valoresUnicos = [...new Set(dadosOriginais.map(d => d[chave]))].sort();
    valoresUnicos.forEach(valor => {
      if (valor) select.innerHTML += `<option value="${valor}">${valor}</option>`;
    });
  };

  preencherSelect('filtroFabricante', 'Fabricante');
  preencherSelect('filtroMotor', 'Motor (Gasolina/Elétrica)');
  preencherSelect('filtroData', 'Mês/Ano');
}

function aplicarFiltros() {
  const fabricante = document.getElementById('filtroFabricante') ? document.getElementById('filtroFabricante').value : "";
  const motor = document.getElementById('filtroMotor') ? document.getElementById('filtroMotor').value : "";
  const data = document.getElementById('filtroData') ? document.getElementById('filtroData').value : "";

  const dadosFiltrados = dadosOriginais.filter(d => {
    return (fabricante === "" || d['Fabricante'] === fabricante) &&
      (motor === "" || d['Motor (Gasolina/Elétrica)'] === motor) &&
      (data === "" || d['Mês/Ano'] === data);
  });

  const contador = document.getElementById('contadorRegistros');
  if (contador) {
    contador.innerText = `Mostrando dados de ${dadosFiltrados.length} registros.`;
  }

  atualizarGraficos(dadosFiltrados);
}

// Agrupador genérico
function agruparVendasPor(dados, chave) {
  return dados.reduce((acc, item) => {
    const valor = item[chave] || 'N/A';
    acc[valor] = (acc[valor] || 0) + item['Quantidade Vendida'];
    return acc;
  }, {});
}

// 1. Processar dados para Gráfico de Linha por Mês (Evolução Temporal)
function processarDadosMensal(dados) {
  const mesesUnicos = [...new Set(dados.map(d => d['Mês/Ano']))].sort((a, b) => {
    const [mesA, anoA] = a.split('/');
    const [mesB, anoB] = b.split('/');
    return new Date(anoA, mesA - 1) - new Date(anoB, mesB - 1);
  });

  const fabricantesUnicos = [...new Set(dados.map(d => d['Fabricante']))];

  const datasets = fabricantesUnicos.map((fab, index) => {
    const dataPoint = mesesUnicos.map(mesAno => {
      const registro = dados.find(d => d['Mês/Ano'] === mesAno && d['Fabricante'] === fab);
      return registro ? registro['Quantidade Vendida'] : 0;
    });

    return {
      label: fab,
      data: dataPoint,
      borderColor: paletaCores[index % paletaCores.length],
      backgroundColor: paletaCores[index % paletaCores.length],
      fill: false,
      tension: 0.2
    };
  });

  return { labels: mesesUnicos, datasets };
}

// 2. Processar dados para Gráfico de Barras por Ano (Consolidado Anual)
function processarDadosAnual(dados) {
  const vendasPorAnoFabricante = {};
  const anosSet = new Set();
  const fabricantesSet = new Set();

  dados.forEach(item => {
    const ano = item['Mês/Ano'].split('/')[1]; // Extrai o ano (ex: '2025')
    const fab = item['Fabricante'];
    const qtd = item['Quantidade Vendida'];

    anosSet.add(ano);
    fabricantesSet.add(fab);

    if (!vendasPorAnoFabricante[fab]) vendasPorAnoFabricante[fab] = {};
    vendasPorAnoFabricante[fab][ano] = (vendasPorAnoFabricante[fab][ano] || 0) + qtd;
  });

  const anosOrdenados = [...anosSet].sort();
  const fabricantesUnicos = [...fabricantesSet];

  const datasets = fabricantesUnicos.map((fab, index) => {
    const dataPoint = anosOrdenados.map(ano => {
      return vendasPorAnoFabricante[fab][ano] || 0;
    });

    return {
      label: fab,
      data: dataPoint,
      backgroundColor: paletaCores[index % paletaCores.length]
    };
  });

  return { labels: anosOrdenados, datasets };
}

function atualizarGraficos(dados) {
  if (graficoLinhaMensal) graficoLinhaMensal.destroy();
  if (graficoBarraAnual) graficoBarraAnual.destroy();
  if (graficoRoscaMotor) graficoRoscaMotor.destroy();

  // Gráfico de Linha por Mês
  const dadosMensais = processarDadosMensal(dados);
  graficoLinhaMensal = new Chart(document.getElementById('graficoLinhaMensal'), {
    type: 'line',
    data: dadosMensais,
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { title: { display: true, text: 'Vendas Totais por Fabricante (Mensal)' } },
      scales: { y: { title: { display: true, text: 'Quantidade Vendida' }, beginAtZero: true } }
    }
  });

  // Gráfico de Barras por Ano
  const dadosAnuais = processarDadosAnual(dados);
  graficoBarraAnual = new Chart(document.getElementById('graficoBarraAnual'), {
    type: 'bar',
    data: dadosAnuais,
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { title: { display: true, text: 'Vendas Totais por Fabricante (Anual)' } },
      scales: { y: { title: { display: true, text: 'Quantidade Vendida' }, beginAtZero: true } }
    }
  });

  // Gráfico de Rosca por Tipo de Motor
  const agrupamentoMotor = agruparVendasPor(dados, 'Motor (Gasolina/Elétrica)');
  graficoRoscaMotor = new Chart(document.getElementById('graficoRoscaMotor'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(agrupamentoMotor),
      datasets: [{ data: Object.values(agrupamentoMotor), backgroundColor: ['#0984e3', '#00b894'] }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { title: { display: true, text: 'Participação por Motorização' } }
    }
  });
}