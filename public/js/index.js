let dadosDetalhados = [];
let dadosTotais = [];

let graficoLinhaTendencia, graficoRoscaMarca, graficoRoscaMotor, graficoRoscaModelo, graficoLinhaMensal, graficoBarraAnual;

const paletaCores = [
  '#00b894', '#0984e3', '#6c5ce7', '#e17055', '#fdcb6e',
  '#00cec9', '#d63031', '#e84393', '#2d3436', '#b2bec3'
];

// Inicialização - Carrega os dois arquivos JSON
window.onload = async () => {
  try {
    const [respDetalhado, respTotais] = await Promise.all([
      fetch('/api/motos'),         // Retorna dados.json (por modelo/tipo)
      fetch('/api/totais')         // Retorna dados-totais.json (totais por fabricante/mês)
    ]);

    dadosDetalhados = await respDetalhado.json();
    dadosTotais = await respTotais.json();

    popularFiltros();
    aplicarFiltros();

    document.querySelectorAll('select').forEach(select => {
      select.addEventListener('change', aplicarFiltros);
    });
  } catch (erro) {
    console.error("Erro ao buscar dados:", erro);
    document.getElementById('contadorRegistros').innerText = "Erro ao carregar bases de dados.";
  }
};

function popularFiltros() {
  const preencherSelect = (idSelect, valoresUnicos) => {
    const select = document.getElementById(idSelect);
    if (!select) return;
    const primeiraOpcao = select.options[0] ? select.options[0].outerHTML : '';
    select.innerHTML = primeiraOpcao;

    valoresUnicos.filter(Boolean).sort().forEach(valor => {
      select.innerHTML += `<option value="${valor}">${valor}</option>`;
    });
  };

  // Extrai valores únicos considerando as chaves corretas de cada base
  const fabricantes = [...new Set([...dadosTotais.map(d => d['Fabricante']), ...dadosDetalhados.map(d => d['Marca'])])];
  const tipos = [...new Set(dadosDetalhados.map(d => d['Tipo']))];
  const motores = [...new Set([...dadosTotais.map(d => d['Motor (Gasolina/Elétrica)']), ...dadosDetalhados.map(d => d['Motor (Gasolina/Elétrica)'])])];
  const datas = [...new Set(dadosTotais.map(d => d['Mês/Ano']))];

  preencherSelect('filtroFabricante', fabricantes);
  preencherSelect('filtroTipo', tipos);
  preencherSelect('filtroMotor', motores);
  preencherSelect('filtroData', datas);
}

function aplicarFiltros() {
  const fabricante = document.getElementById('filtroFabricante')?.value || "";
  const tipo = document.getElementById('filtroTipo')?.value || "";
  const motor = document.getElementById('filtroMotor')?.value || "";
  const data = document.getElementById('filtroData')?.value || "";

  // Filtra dados detalhados (modelos)
  const filtradosDetalhado = dadosDetalhados.filter(d => {
    return (fabricante === "" || d['Marca'] === fabricante) &&
      (tipo === "" || d['Tipo'] === tipo) &&
      (motor === "" || d['Motor (Gasolina/Elétrica)'] === motor) &&
      (data === "" || d['Mês/Ano'] === data);
  });

  // Filtra dados totais por fabricante
  const filtradosTotais = dadosTotais.filter(d => {
    return (fabricante === "" || d['Fabricante'] === fabricante) &&
      (motor === "" || d['Motor (Gasolina/Elétrica)'] === motor) &&
      (data === "" || d['Mês/Ano'] === data);
  });

  const contador = document.getElementById('contadorRegistros');
  if (contador) {
    contador.innerText = `Mostrando dados de ${filtradosDetalhado.length} registros detalhados e ${filtradosTotais.length} registros totais.`;
  }

  atualizarGraficos(filtradosDetalhado, filtradosTotais);
}

// Agrupador genérico
function agruparVendasPor(dados, chave, chaveQtd = 'Quantidade Vendida') {
  return dados.reduce((acc, item) => {
    const valor = item[chave] || 'N/A';
    acc[valor] = (acc[valor] || 0) + item[chaveQtd];
    return acc;
  }, {});
}

// Processamento para Gráfico de Linha de Participação (%) por Ano
function processarDadosLinha(dadosTotais) {
  const vendasPorAno = {};
  const vendasTotaisPorAno = {};

  dadosTotais.forEach(item => {
    const partesData = item['Mês/Ano'] ? item['Mês/Ano'].split('/') : [];
    const ano = partesData[1] || '2025';
    const fab = item['Fabricante'] || 'Outros';
    const qtd = item['Quantidade Vendida'] || 0;

    if (!vendasPorAno[ano]) vendasPorAno[ano] = {};
    vendasPorAno[ano][fab] = (vendasPorAno[ano][fab] || 0) + qtd;
    vendasTotaisPorAno[ano] = (vendasTotaisPorAno[ano] || 0) + qtd;
  });

  const anosOrdenados = Object.keys(vendasPorAno).sort();
  const fabricantesUnicos = [...new Set(dadosTotais.map(d => d['Fabricante']))].filter(Boolean);

  const datasets = fabricantesUnicos.map((fab, index) => {
    const dataPoint = anosOrdenados.map(ano => {
      const vendaNoAno = vendasPorAno[ano][fab] || 0;
      const totalNoAno = vendasTotaisPorAno[ano] || 1;
      return ((vendaNoAno / totalNoAno) * 100).toFixed(2);
    });

    return {
      label: fab,
      data: dataPoint,
      borderColor: paletaCores[index % paletaCores.length],
      backgroundColor: paletaCores[index % paletaCores.length],
      fill: false,
      tension: 0.3
    };
  });

  return { labels: anosOrdenados, datasets };
}

// Processamento para Evolução Mensal (Linhas)
function processarDadosMensal(dadosTotais) {
  const mesesUnicos = [...new Set(dadosTotais.map(d => d['Mês/Ano']))].sort((a, b) => {
    const [mA, aA] = a.split('/');
    const [mB, aB] = b.split('/');
    return new Date(aA, mA - 1) - new Date(aB, mB - 1);
  });
  const fabricantesUnicos = [...new Set(dadosTotais.map(d => d['Fabricante']))];

  const datasets = fabricantesUnicos.map((fab, index) => {
    const dataPoint = mesesUnicos.map(mesAno => {
      const reg = dadosTotais.find(d => d['Mês/Ano'] === mesAno && d['Fabricante'] === fab);
      return reg ? reg['Quantidade Vendida'] : 0;
    });
    return {
      label: fab,
      data: dataPoint,
      borderColor: paletaCores[index % paletaCores.length],
      fill: false,
      tension: 0.2
    };
  });

  return { labels: mesesUnicos, datasets };
}

// Processamento para Barras Anuais
function processarDadosAnual(dadosTotais) {
  const mapAnosFabs = {};
  const anosSet = new Set();
  const fabsSet = new Set();

  dadosTotais.forEach(item => {
    const ano = item['Mês/Ano'].split('/')[1];
    const fab = item['Fabricante'];
    const qtd = item['Quantidade Vendida'];

    anosSet.add(ano);
    fabsSet.add(fab);

    if (!mapAnosFabs[fab]) mapAnosFabs[fab] = {};
    mapAnosFabs[fab][ano] = (mapAnosFabs[fab][ano] || 0) + qtd;
  });

  const anosOrdenados = [...anosSet].sort();
  const datasets = [...fabsSet].map((fab, index) => {
    const dataPoint = anosOrdenados.map(ano => mapAnosFabs[fab][ano] || 0);
    return {
      label: fab,
      data: dataPoint,
      backgroundColor: paletaCores[index % paletaCores.length]
    };
  });

  return { labels: anosOrdenados, datasets };
}

function atualizarGraficos(dadosDetalhado, dadosTotais) {
  if (graficoLinhaTendencia) graficoLinhaTendencia.destroy();
  if (graficoRoscaMarca) graficoRoscaMarca.destroy();
  if (graficoRoscaMotor) graficoRoscaMotor.destroy();
  if (graficoRoscaModelo) graficoRoscaModelo.destroy();
  if (graficoLinhaMensal) graficoLinhaMensal.destroy();
  if (graficoBarraAnual) graficoBarraAnual.destroy();

  // 1. Gráfico de Linha Tendência (%)
  const elLinha = document.getElementById('graficoLinhaTendencia');
  if (elLinha) {
    graficoLinhaTendencia = new Chart(elLinha, {
      type: 'line',
      data: processarDadosLinha(dadosTotais),
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { title: { display: true, text: 'Participação (%)' }, beginAtZero: true } } }
    });
  }

  // Auxiliar rosca
  const criarRosca = (id, dadosBase, chave) => {
    const el = document.getElementById(id);
    if (!el) return null;
    const agrupamento = agruparVendasPor(dadosBase, chave);
    return new Chart(el, {
      type: 'doughnut',
      data: {
        labels: Object.keys(agrupamento),
        datasets: [{ data: Object.values(agrupamento), backgroundColor: paletaCores }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  };

  // 2. Vendas por Fabricante (Totais)
  graficoRoscaMarca = criarRosca('graficoRoscaMarca', dadosTotais, 'Fabricante');

  // 3. Vendas por Tipo de Motor (Detalhado)
  graficoRoscaMotor = criarRosca('graficoRoscaMotor', dadosDetalhado, 'Motor (Gasolina/Elétrica)');

  // 4. Vendas por Modelo (Detalhado)
  graficoRoscaModelo = criarRosca('graficoRoscaModelo', dadosDetalhado, 'Modelo');

  // 5. Evolução Mensal (Linha)
  const elMensal = document.getElementById('graficoLinhaMensal');
  if (elMensal) {
    graficoLinhaMensal = new Chart(elMensal, {
      type: 'line',
      data: processarDadosMensal(dadosTotais),
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 6. Comparativo Anual (Barras)
  const elAnual = document.getElementById('graficoBarraAnual');
  if (elAnual) {
    graficoBarraAnual = new Chart(elAnual, {
      type: 'bar',
      data: processarDadosAnual(dadosTotais),
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}