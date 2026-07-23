var tablinks = document.getElementsByClassName("tab-links");
var tabcontents = document.getElementsByClassName("tab-contents");

function opentab(tabname) {
  for (var i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove("active-link");
  }
  for (var i = 0; i < tabcontents.length; i++) {
    tabcontents[i].classList.remove("active-tab");
    if (tabcontents[i].id === tabname) {
      tabcontents[i].classList.add("active-tab");
    }
  }
  event.currentTarget.classList.add("active-link");
}

const isMobile = window.innerWidth <= 768;
const inputPesquisa = document.getElementById('barraPesquisa');
const containerLista = document.getElementById('containerLista');
const contadorProjetos = document.getElementById('contadorProjetos');
const selectUnidade = document.getElementById('selectUnidade');

let graficoUnidades, graficoTipos, graficoFormacao, graficoAreas, graficoAno, graficoCoordenadores;

const paletaCores = [
  '#00b894', '#0984e3', '#6c5ce7', '#e17055', '#fdcb6e',
  '#00cec9', '#d63031', '#e84393',
  '#1abc9c',
  '#ff9f43', '#1c5f52ff',
  '#6ac579ff'
];

function contarOcorrencias(dados, chave) {
  return dados.reduce((acc, projeto) => {
    const valor = projeto[chave] || 'Não Informado';
    acc[valor] = (acc[valor] || 0) + 1;
    return acc;
  }, {});
}

// Isola a lógica de extrair o ano para podermos usar em vários lugares
function extrairAno(projeto) {
  let rawData = projeto['Vigência (Início)'];
  if (!rawData) return null;

  const dataString = String(rawData).trim();
  if (dataString === "") return null;

  let ano;
  if (!isNaN(dataString) && dataString.length === 4) {
    ano = parseInt(dataString);
  } else if (dataString.includes('/')) {
    const partes = dataString.split('/');
    if (partes.length === 3) ano = parseInt(partes[2]);
  } else {
    ano = new Date(dataString).getFullYear();
  }

  if (!isNaN(ano) && ano > 2000 && ano < 2100) {
    return ano;
  }
  return null;
}

function contarProjetosPorAno(dados) {
  const contagem = {};

  dados.forEach(projeto => {
    const ano = extrairAno(projeto);
    if (ano) {
      contagem[ano] = (contagem[ano] || 0) + 1;
    }
  });

  const anosOrdenados = Object.keys(contagem).sort();
  const valoresOrdenados = anosOrdenados.map(ano => contagem[ano]);

  return { anos: anosOrdenados, valores: valoresOrdenados };
}

function popularSelectUnidades() {
  const unidadesUnicas = [...new Set(projetosIFNMG.map(p => p['Unidade']))].filter(Boolean).sort();

  selectUnidade.innerHTML = '<option value="">Todos os Campi</option>';
  unidadesUnicas.forEach(unidade => {
    const option = document.createElement('option');
    option.value = unidade;
    option.textContent = unidade;
    selectUnidade.appendChild(option);
  });
}

// Preenche o select de anos dinamicamente
function popularSelectAnosCoordenador() {
  const selectAno = document.getElementById('selectAnoCoordenador');
  if (!selectAno) return;

  const anosUnicos = new Set();
  projetosIFNMG.forEach(projeto => {
    const ano = extrairAno(projeto);
    if (ano) anosUnicos.add(ano);
  });

  const anosOrdenados = [...anosUnicos].sort((a, b) => b - a); // Do mais recente para o mais antigo

  selectAno.innerHTML = '<option value="">Todos os Anos</option>';
  anosOrdenados.forEach(ano => {
    const option = document.createElement('option');
    option.value = ano;
    option.textContent = ano;
    selectAno.appendChild(option);
  });
}

function renderizarLista(dados) {
  contadorProjetos.innerText = `Mostrando ${dados.length} projetos.`;
  containerLista.innerHTML = '';

  dados.slice(0, 100).forEach(projeto => {
    const div = document.createElement('div');
    div.style.padding = '15px';
    div.style.marginBottom = '12px';
    div.style.backgroundColor = '#ffffff';
    div.style.borderRadius = '8px';
    div.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    div.style.borderLeft = '5px solid #00b894';
    div.style.transition = 'transform 0.2s';
    div.innerHTML = `
      <strong style="color: #2d3436; font-size: 1.1em; display: block; margin-bottom: 8px;">
        ${projeto['Título do Projeto']}
      </strong>
      <small style="color: #636e72; font-size: 0.9em;">
        <i class="fa-solid fa-location-dot" style="color: #00b894;"></i> <b>${projeto['Unidade']}</b> &nbsp;|&nbsp; 
        <i class="fa-solid fa-book" style="color: #0984e3;"></i> ${projeto['Área']} &nbsp;|&nbsp; 
        <i class="fa-solid fa-user" style="color: #6c5ce7;"></i> Coordenador: ${projeto['Coordenador']}&nbsp;|&nbsp; 
        <i class="fa-solid fa-folder" style="color: #6c5ce7;"></i> SEI: ${projeto['Processo SEI']}
      </small>
    `;

    div.addEventListener('mouseenter', () => div.style.transform = 'translateY(-2px)');
    div.addEventListener('mouseleave', () => div.style.transform = 'translateY(0)');

    containerLista.appendChild(div);
  });
}

function atualizarGraficos(dadosCompletos, dadosSemFiltroUnidade) {
  const isMobile = window.innerWidth <= 768;

  const contagemUnidades = contarOcorrencias(dadosSemFiltroUnidade, 'Unidade');
  const contagemTipos = contarOcorrencias(dadosCompletos, 'Tipo');
  const contagemAreas = contarOcorrencias(dadosCompletos, 'Área');
  const coordenadoresVistos = new Set();
  const formacoesUnicas = [];

  dadosCompletos.forEach(projeto => {
    const nome = projeto['Coordenador'];
    if (nome && !coordenadoresVistos.has(nome)) {
      coordenadoresVistos.add(nome);
      formacoesUnicas.push(projeto);
    }
  });

  const contagemFormacao = contarOcorrencias(formacoesUnicas, 'Formação');
  const dadosAno = contarProjetosPorAno(dadosCompletos);

  const selectAno = document.getElementById('selectAnoCoordenador');
  const anoSelecionado = selectAno ? selectAno.value : "";

  const dadosParaCoordenadores = dadosCompletos.filter(projeto => {
    if (anoSelecionado === "") return true;
    const anoProjeto = extrairAno(projeto);
    return anoProjeto && anoProjeto.toString() === anoSelecionado;
  });

  const contagemCoordenadores = contarOcorrencias(dadosParaCoordenadores, 'Coordenador');
  const todosCoordenadoresOrdenados = Object.entries(contagemCoordenadores)
    .sort((a, b) => b[1] - a[1]);

  let labelsCoordenadores = [];
  let valoresCoordenadores = [];

  if (isMobile) {
    const top10 = todosCoordenadoresOrdenados.slice(0, 10);
    const outros = todosCoordenadoresOrdenados.slice(10);
    const somaOutros = outros.reduce((acc, atual) => acc + atual[1], 0);

    labelsCoordenadores = top10.map(item => item[0]);
    valoresCoordenadores = top10.map(item => item[1]);

    if (somaOutros > 0) {
      labelsCoordenadores.push('Outros');
      valoresCoordenadores.push(somaOutros);
    }
  } else {
    const top20 = todosCoordenadoresOrdenados.slice(0, 20);
    labelsCoordenadores = top20.map(item => item[0]);
    valoresCoordenadores = top20.map(item => item[1]);
  }

  // Destruir gráficos anteriores
  if (graficoUnidades) graficoUnidades.destroy();
  if (graficoTipos) graficoTipos.destroy();
  if (graficoFormacao) graficoFormacao.destroy();
  if (graficoAreas) graficoAreas.destroy();
  if (graficoAno) graficoAno.destroy();
  if (graficoCoordenadores) graficoCoordenadores.destroy();

  graficoUnidades = new Chart(document.getElementById('graficoUnidades'), {
    type: isMobile ? 'pie' : 'bar',
    data: {
      labels: Object.keys(contagemUnidades),
      datasets: [{
        label: 'Projetos',
        data: Object.values(contagemUnidades),
        backgroundColor: isMobile ? paletaCores : '#00b894',
        borderWidth: isMobile ? 0 : 1,
        borderRadius: isMobile ? 0 : 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: isMobile,
          position: 'bottom'
        }
      }
    }
  });

  graficoTipos = new Chart(document.getElementById('graficoTipos'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(contagemTipos),
      datasets: [{
        data: Object.values(contagemTipos),
        backgroundColor: paletaCores,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  graficoFormacao = new Chart(document.getElementById('graficoFormacao'), {
    type: 'pie',
    data: {
      labels: Object.keys(contagemFormacao),
      datasets: [{
        data: Object.values(contagemFormacao),
        backgroundColor: paletaCores,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  graficoAreas = new Chart(document.getElementById('graficoAreas'), {
    type: isMobile ? 'pie' : 'bar',
    data: {
      labels: Object.keys(contagemAreas),
      datasets: [{
        label: 'Projetos',
        data: Object.values(contagemAreas),
        backgroundColor: isMobile ? paletaCores : '#e17055',
        borderWidth: isMobile ? 0 : 1,
        borderRadius: isMobile ? 0 : 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: isMobile ? 'x' : 'y',
      plugins: {
        legend: {
          display: isMobile,
          position: 'bottom'
        }
      }
    }
  });

  graficoAno = new Chart(document.getElementById('graficoAno'), {
    type: 'line',
    data: {
      labels: dadosAno.anos,
      datasets: [{
        label: 'Projetos Iniciados',
        data: dadosAno.valores,
        borderColor: '#0984e3',
        backgroundColor: 'rgba(9, 132, 227, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#0984e3',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f1f2f6' },
          ticks: {
            stepSize: 50,
            font: { size: 12 }
          }
        }
      }
    }
  });


  graficoCoordenadores = new Chart(document.getElementById('graficoCoordenadores'), {
    type: isMobile ? 'pie' : 'bar',
    data: {
      labels: labelsCoordenadores, // CORRIGIDO AQUI!
      datasets: [{
        label: 'Total de Projetos',
        data: valoresCoordenadores, // CORRIGIDO AQUI!
        backgroundColor: isMobile ? paletaCores : '#6c5ce7',
        borderWidth: isMobile ? 0 : 1,
        borderRadius: isMobile ? 0 : 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: isMobile ? 'x' : 'y',
      plugins: {
        legend: {
          display: isMobile,
          position: 'bottom'
        }
      },
      scales: isMobile ? {} : {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        },
        y: {
          grid: { display: false },
          ticks: {
            autoSkip: false,
            font: { size: 12 }
          }
        }
      }
    }
  });
}

function inicializarDashboard() {
  popularSelectUnidades();
  popularSelectAnosCoordenador(); // Popula o select de anos
  atualizarGraficos(projetosIFNMG, projetosIFNMG);
  renderizarLista(projetosIFNMG);
}

function aplicarFiltros() {
  const termo = inputPesquisa.value.toLowerCase();
  const unidadeSelecionada = selectUnidade.value;

  const dadosParaGraficos = projetosIFNMG.filter(projeto => {
    return unidadeSelecionada === "" || projeto['Unidade'] === unidadeSelecionada;
  });
  const dadosParaLista = dadosParaGraficos.filter(projeto => {
    return (projeto['Título do Projeto'] && projeto['Título do Projeto'].toLowerCase().includes(termo)) ||
      (projeto['Coordenador'] && projeto['Coordenador'].toLowerCase().includes(termo)) ||
      (projeto['Área'] && projeto['Área'].toLowerCase().includes(termo));
  });

  atualizarGraficos(dadosParaGraficos, projetosIFNMG);
  renderizarLista(dadosParaLista);
}

// Event Listeners
inputPesquisa.addEventListener('input', aplicarFiltros);
selectUnidade.addEventListener('change', aplicarFiltros);

// Event listener para atualizar ao mudar de ano
const selectAnoCoordenador = document.getElementById('selectAnoCoordenador');
if (selectAnoCoordenador) {
  selectAnoCoordenador.addEventListener('change', aplicarFiltros);
}

let projetosIFNMG = [];

async function buscarProjetosDoBanco() {
  try {
    contadorProjetos.innerText = "Conectando ao banco de dados...";

    const resposta = await fetch('/api/projetos');
    const dadosDoBanco = await resposta.json();

    projetosIFNMG = dadosDoBanco.map(projeto => ({
      id: projeto.id,
      "Título do Projeto": projeto.titulo,
      "Área": projeto.area,
      "Unidade": projeto.unidade,
      "Coordenador": projeto.coordenador,
      "E-mail": projeto.email,
      "Tipo": projeto.tipo,
      "Formação": projeto.formacao,
      "Carreira": projeto.carreira,
      "Vigência (Início)": projeto.vigencia_inicio,
      "Vigência (Término)": projeto.vigencia_termino,
      "Processo SEI": projeto.processo_sei,
      "Ética e Segurança": projeto.etica_seguranca
    }));

    inicializarDashboard();

  } catch (erro) {
    console.error("Erro ao carregar dados do banco:", erro);
    contadorProjetos.innerText = "Erro ao carregar projetos. Verifique o console.";
    contadorProjetos.style.color = "#d63031";
  }
}

window.onload = buscarProjetosDoBanco;

document.addEventListener("DOMContentLoaded", function () {
  const innerContainer = document.getElementById("logoloop-inner");
  const originalList = document.getElementById("original-list");

  if (innerContainer && originalList) {
    setupLogoLoop();
    window.addEventListener("resize", setupLogoLoop);
  }

  function setupLogoLoop() {
    innerContainer
      .querySelectorAll('.logoloop-list[aria-hidden="true"]')
      .forEach((clone) => clone.remove());

    const totalClones = 2;

    for (let i = 0; i < totalClones; i++) {
      const clone = originalList.cloneNode(true);
      clone.removeAttribute("id");
      clone.setAttribute("aria-hidden", "true");
      innerContainer.appendChild(clone);
    }

    const gap =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--logo-gap"
        )
      ) || 0;
    const originalWidth = originalList.offsetWidth + gap;

    innerContainer.style.setProperty("--scroll-distance", `${originalWidth}px`);
  }
});

function toggleMenu() {
  const sidebar = document.getElementById('sidemenu');
  sidebar.classList.toggle('active');
}

document.addEventListener('click', function (event) {
  const sidebar = document.getElementById('sidemenu');
  const toggleBtn = document.querySelector('.menu-toggle');

  if (sidebar && toggleBtn) {
    if (!sidebar.contains(event.target) && !toggleBtn.contains(event.target) && sidebar.classList.contains('active')) {
      sidebar.classList.remove('active');
    }
  }
});

const navItems = document.querySelectorAll('.nav-links li');
navItems.forEach(item => {
  item.addEventListener('click', function () {
    navItems.forEach(nav => nav.classList.remove('active'));

    this.classList.add('active');

    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('sidemenu');
      if (sidebar) sidebar.classList.remove('active');
    }
  });
});