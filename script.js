(function () {
'use strict';

if (window.__educafinInitialized) return;
window.__educafinInitialized = true;

const $ = (id) => document.getElementById(id);
const currency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const safeNumber = (value) => value === '' ? NaN : Number(value);
const STORAGE_KEY = 'educafin_progress_v1';

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { xp: 0, quizBest: 0, answered: false };
    const parsed = JSON.parse(raw);
    return {
      xp: Number.isFinite(parsed.xp) && parsed.xp >= 0 ? parsed.xp : 0,
      quizBest: Number.isFinite(parsed.quizBest) && parsed.quizBest >= 0 ? parsed.quizBest : 0,
      answered: Boolean(parsed.answered)
    };
  } catch (_) {
    return { xp: 0, quizBest: 0, answered: false };
  }
}
let progress = loadProgress();
function saveProgress() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* O site continua utilizável sem armazenamento local. */ }
  renderProgress();
}
function renderProgress() {
  $('xp-total').textContent = String(progress.xp);
  $('progress-message').textContent = progress.answered
    ? `Você já respondeu ao quiz. Sua melhor pontuação registrada é ${progress.quizBest} acertos. Continue explorando as aulas e simulações.`
    : 'Responda ao quiz para registrar sua primeira conquista.';
}

function showTab(tabId) {
  document.querySelectorAll('.menu-item').forEach((button) => button.classList.toggle('active', button.dataset.tab === tabId));
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === tabId));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => showTab(button.dataset.tab)));
document.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => showTab(button.dataset.go)));

function updateBudget() {
  const income = safeNumber($('income').value);
  const essential = safeNumber($('essential').value);
  const wants = safeNumber($('wants').value);
  const goal = safeNumber($('goal').value);
  const values = [income, essential, wants, goal];
  const error = $('budget-error');
  if (values.some((n) => !Number.isFinite(n) || n < 0 || n > 1000000)) {
    error.textContent = 'Digite valores válidos entre R$ 0 e R$ 1.000.000.';
    return;
  }
  error.textContent = '';
  const balance = income - essential - wants - goal;
  $('out-income').textContent = currency(income);
  $('out-essential').textContent = currency(essential);
  $('out-wants').textContent = currency(wants);
  $('out-goal').textContent = currency(goal);
  $('out-balance').textContent = currency(balance);
  $('balance-label').textContent = balance < 0 ? 'Valor acima do disponível' : 'Saldo restante';
  $('out-balance').parentElement.classList.toggle('negative', balance < 0);
  const bar = $('balance-bar');
  bar.style.width = `${income > 0 ? Math.min(100, Math.max(0, balance / income * 100)) : 0}%`;
  bar.style.background = balance < 0 ? 'var(--red)' : 'var(--green)';
  $('budget-feedback').textContent = balance < 0
    ? `Os valores planejados ultrapassam o dinheiro disponível em ${currency(Math.abs(balance))}. Tente ajustar alguma categoria.`
    : balance === 0
      ? 'Todo o dinheiro disponível foi distribuído. Confira se esse plano cobre as prioridades que você escolheu.'
      : `Seu plano tem ${currency(balance)} restantes. Você pode manter uma margem para imprevistos ou ajustar sua meta.`;
}
['income', 'essential', 'wants', 'goal'].forEach((id) => $(id).addEventListener('input', updateBudget));

function calculateInterest() {
  const capital = safeNumber($('capital').value);
  const rate = safeNumber($('rate').value);
  const periods = safeNumber($('periods').value);
  const error = $('interest-error');
  if (!Number.isFinite(capital) || capital < 0 || capital > 10000000 || !Number.isFinite(rate) || rate < 0 || rate > 100 || !Number.isInteger(periods) || periods < 0 || periods > 600) {
    error.textContent = 'Use capital entre R$ 0 e R$ 10.000.000, taxa entre 0% e 100% e até 600 períodos inteiros.';
    return;
  }
  error.textContent = '';
  const decimalRate = rate / 100;
  const simpleInterest = capital * decimalRate * periods;
  const simpleTotal = capital + simpleInterest;
  const compoundTotal = capital * Math.pow(1 + decimalRate, periods);
  const compoundInterest = compoundTotal - capital;
  $('simple-total').textContent = currency(simpleTotal);
  $('simple-interest').textContent = `Juros: ${currency(simpleInterest)}`;
  $('compound-total').textContent = currency(compoundTotal);
  $('compound-interest').textContent = `Juros: ${currency(compoundInterest)}`;
  const unit = $('period-unit').value;
  $('interest-explanation').textContent = `Considerando uma taxa constante de ${rate}% por ${unit}, durante ${periods} ${periods === 1 ? 'período' : 'períodos'}, os juros simples somam ${currency(simpleInterest)} e os compostos somam ${currency(compoundInterest)}. Nos juros simples, o cálculo usa sempre o capital inicial; nos compostos, cada período considera o saldo acumulado.`;
}
$('calculate-interest').addEventListener('click', calculateInterest);
['capital', 'rate', 'periods', 'period-unit'].forEach((id) => $(id).addEventListener('change', calculateInterest));

const challengePool = [
  {
    title: 'Uma compra por impulso',
    prompt: 'Você vê um tênis em promoção, mas não tinha planejado comprá-lo. O que ajuda a decidir?',
    options: [
      { text: 'Comprar imediatamente porque está em promoção.', correct: false, feedback: 'Uma promoção não significa que a compra seja necessária ou caiba no orçamento. Compare o preço e pense se pode esperar.' },
      { text: 'Verificar o orçamento, comparar preços e avaliar se precisa dele agora.', correct: true, feedback: 'Boa escolha. Comparar preços, avaliar a necessidade e conferir o orçamento ajuda a decidir com mais informação.' },
      { text: 'Parcelar sem conferir o custo total.', correct: false, feedback: 'Parcelas podem comprometer os próximos meses. Confira as condições e o valor total antes de assumir o compromisso.' }
    ]
  },
  {
    title: 'Meta de curto prazo',
    prompt: 'Você quer juntar R$ 120 em três meses. Qual plano ajuda a acompanhar a meta?',
    options: [
      { text: 'Guardar qualquer valor só no último dia.', correct: false, feedback: 'Deixar tudo para o final dificulta acompanhar o progresso. Um plano periódico torna a meta mais visível.' },
      { text: 'Separar cerca de R$ 40 por mês, se isso couber no orçamento.', correct: true, feedback: 'Isso mesmo. R$ 120 divididos por três meses correspondem a R$ 40 por mês, desde que seja viável para o orçamento.' },
      { text: 'Usar o dinheiro reservado para gastos inesperados sem revisar o plano.', correct: false, feedback: 'Misturar objetivos dificulta saber quanto já foi guardado. Se precisar mudar o plano, revise a meta e os valores.' }
    ]
  },
  {
    title: 'Oferta parcelada',
    prompt: 'Uma loja anuncia 10 parcelas de R$ 35. O que você deve descobrir antes de comprar?',
    options: [
      { text: 'Somente se a primeira parcela cabe no bolso.', correct: false, feedback: 'A primeira parcela não mostra o compromisso inteiro. É importante considerar as dez parcelas e outros custos.' },
      { text: 'O valor total, as taxas e as condições do parcelamento.', correct: true, feedback: 'Correto. Dez parcelas de R$ 35 totalizam R$ 350, mas também é importante verificar taxas e condições.' },
      { text: 'Se a propaganda usa uma cor chamativa.', correct: false, feedback: 'A aparência do anúncio não informa o custo real. Confira valores, taxas e condições do contrato.' }
    ]
  },
  {
    title: 'Mensagem suspeita',
    prompt: 'Você recebe uma mensagem dizendo que precisa informar um código bancário para receber um prêmio. O que fazer?',
    options: [
      { text: 'Não compartilhar o código e confirmar a mensagem por um canal oficial.', correct: true, feedback: 'Boa atitude. Senhas e códigos de autenticação são privados. Procure o canal oficial sem usar o link recebido.' },
      { text: 'Enviar o código se o logotipo parecer verdadeiro.', correct: false, feedback: 'Logotipos podem ser copiados. Nunca compartilhe códigos de autenticação por mensagem.' },
      { text: 'Encaminhar a mensagem para que outras pessoas testem.', correct: false, feedback: 'Repassar pode expor outras pessoas ao risco. É melhor não clicar e verificar por canais oficiais.' }
    ]
  },
  {
    title: 'Gastos recorrentes',
    prompt: 'Você percebe que várias pequenas assinaturas são cobradas todo mês. Qual é uma boa atitude?',
    options: [
      { text: 'Ignorar porque cada cobrança é pequena.', correct: false, feedback: 'Pequenas cobranças recorrentes podem somar um valor relevante ao longo do tempo.' },
      { text: 'Cancelar todas sem conferir se alguma é necessária.', correct: false, feedback: 'Vale avaliar o uso e a importância de cada serviço antes de decidir o que manter ou cancelar.' },
      { text: 'Revisar quais serviços usa e somar o custo mensal e anual.', correct: true, feedback: 'Isso ajuda a entender o impacto total e decidir quais serviços fazem sentido para suas prioridades.' }
    ]
  },
  {
    title: 'Imprevisto no orçamento',
    prompt: 'Um gasto inesperado apareceu e seu plano ficou apertado. Qual é o próximo passo mais útil?',
    options: [
      { text: 'Revisar os gastos flexíveis e ajustar o plano sem ignorar necessidades essenciais.', correct: true, feedback: 'Revisar o orçamento ajuda a priorizar o que é essencial e ajustar o que pode esperar.' },
      { text: 'Assumir qualquer dívida sem comparar condições.', correct: false, feedback: 'Crédito pode ter custos e compromissos futuros. Antes de considerar essa opção, entenda as condições e alternativas.' },
      { text: 'Parar de acompanhar os gastos até o mês acabar.', correct: false, feedback: 'Acompanhar os gastos permite perceber o que pode ser ajustado antes que o problema aumente.' }
    ]
  },
  {
    title: 'Comparação de preços',
    prompt: 'Dois produtos semelhantes têm preços diferentes. O que vale comparar além do preço anunciado?',
    options: [
      { text: 'Apenas qual embalagem é mais bonita.', correct: false, feedback: 'A aparência não informa sozinha se a compra vale a pena.' },
      { text: 'Quantidade, qualidade, durabilidade, frete e condições de pagamento.', correct: true, feedback: 'Esses fatores ajudam a comparar o custo e o benefício de cada opção.' },
      { text: 'O número de pessoas que curtiram a propaganda.', correct: false, feedback: 'Curtidas não garantem qualidade nem que o produto atenda às suas necessidades.' }
    ]
  },
  {
    title: 'Renda extra',
    prompt: 'Você recebeu um dinheiro extra. O que pode ajudar a usá-lo de forma consciente?',
    options: [
      { text: 'Gastar tudo imediatamente para comemorar.', correct: false, feedback: 'Você pode aproveitar parte do dinheiro, mas vale considerar prioridades e objetivos antes de decidir.' },
      { text: 'Definir prioridades e decidir quanto destinar a gastos, metas ou reserva.', correct: true, feedback: 'Planejar antes de gastar permite equilibrar necessidades atuais e objetivos futuros.' },
      { text: 'Investir tudo em algo que promete retorno garantido e rápido.', correct: false, feedback: 'Promessas de retorno garantido e rápido são um sinal de alerta. É importante entender riscos e verificar informações.' }
    ]
  }
];
let challengeDeck = [];
let lastChallenge = null;
let currentChallenge = null;
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function renderChallenge() {
  if (challengeDeck.length === 0) {
    challengeDeck = shuffle(challengePool);
    if (challengeDeck.length > 1 && challengeDeck[challengeDeck.length - 1] === lastChallenge) {
      [challengeDeck[0], challengeDeck[challengeDeck.length - 1]] = [challengeDeck[challengeDeck.length - 1], challengeDeck[0]];
    }
  }
  currentChallenge = challengeDeck.pop();
  lastChallenge = currentChallenge;
  $('challenge-title').textContent = currentChallenge.title;
  $('challenge-prompt').textContent = currentChallenge.prompt;
  $('challenge-options').replaceChildren();
  $('challenge-feedback').textContent = 'Escolha uma resposta para ver a explicação.';
  $('new-challenge').hidden = true;
  shuffle(currentChallenge.options).forEach((option) => {
    const button = document.createElement('button');
    button.className = 'opt-button';
    button.textContent = option.text;
    button.addEventListener('click', () => {
      $('challenge-options').querySelectorAll('button').forEach((item) => { item.disabled = true; });
      button.classList.add(option.correct ? 'correct' : 'incorrect');
      $('challenge-feedback').textContent = option.feedback;
      if (option.correct) {
        progress.xp += 5;
        saveProgress();
      }
      $('new-challenge').hidden = false;
    });
    $('challenge-options').appendChild(button);
  });
}
$('new-challenge').addEventListener('click', renderChallenge);

const quizPool = [
  { q: 'Qual frase descreve melhor um orçamento?', options: ['Uma lista de compras sem limite de valor.', 'Um plano para acompanhar entradas, gastos e objetivos.', 'Uma forma de garantir que o dinheiro nunca acabe.'], answer: 1, explanation: 'Um orçamento ajuda a organizar o dinheiro e planejar escolhas. Ele não garante que não haverá imprevistos.' },
  { q: 'Antes de parcelar uma compra, o que é importante verificar?', options: ['Apenas o valor da primeira parcela.', 'Se o anúncio tem muitas curtidas.', 'As condições, os juros e o valor total a pagar.'], answer: 2, explanation: 'O custo total e as condições mostram melhor o compromisso assumido do que olhar apenas a parcela.' },
  { q: 'O que acontece nos juros compostos?', options: ['Os juros acumulados passam a fazer parte da base de cálculo dos próximos períodos.', 'A taxa deixa de existir depois do primeiro mês.', 'O valor final é sempre menor que o capital inicial.'], answer: 0, explanation: 'Nos juros compostos, o saldo acumulado de cada período é usado no cálculo do seguinte.' },
  { q: 'Uma mensagem pede sua senha bancária para liberar um prêmio. O que fazer?', options: ['Enviar a senha se a mensagem tiver um logotipo.', 'Não compartilhar a senha e verificar a informação por um canal oficial.', 'Encaminhar a mensagem aos colegas para que tentem.'], answer: 1, explanation: 'Senhas e códigos são privados. Não clique em links suspeitos e confirme informações diretamente em canais oficiais.' },
  { q: 'Você tem R$ 80 e planeja gastar R$ 25 com transporte e R$ 30 com alimentação. Quanto sobra?', options: ['R$ 15.', 'R$ 25.', 'R$ 55.'], answer: 1, explanation: 'R$ 80 − R$ 25 − R$ 30 = R$ 25 de saldo.' },
  { q: 'Qual é um exemplo de gasto recorrente?', options: ['Uma compra feita uma única vez.', 'Uma assinatura cobrada todos os meses.', 'Um presente recebido no aniversário.'], answer: 1, explanation: 'Gastos recorrentes se repetem em intervalos regulares, como assinaturas ou algumas contas.' },
  { q: 'Por que é útil comparar o preço por unidade ou por quilo?', options: ['Ajuda a comparar embalagens de tamanhos diferentes.', 'Garante que o produto mais caro é melhor.', 'Elimina a necessidade de conferir a qualidade.'], answer: 0, explanation: 'O preço por unidade de medida facilita comparar produtos com quantidades diferentes, embora qualidade e necessidade também importem.' },
  { q: 'O que significa ter uma reserva para imprevistos?', options: ['Dinheiro separado para despesas inesperadas, conforme as possibilidades.', 'Dinheiro que deve ser gasto assim que sobrar.', 'Uma garantia de que nunca haverá dificuldades financeiras.'], answer: 0, explanation: 'Uma reserva pode ajudar a lidar com despesas inesperadas, mas seu tamanho depende da realidade de cada pessoa.' },
  { q: 'Qual comportamento ajuda a proteger seus dados financeiros?', options: ['Usar a mesma senha em todos os serviços.', 'Compartilhar códigos de autenticação com quem os pedir.', 'Acessar serviços por canais oficiais e manter senhas privadas.'], answer: 2, explanation: 'Senhas únicas e privadas, junto com canais oficiais, ajudam a reduzir riscos de fraude.' },
  { q: 'Uma taxa de juros de 2% ao mês deve ser entendida como:', options: ['2% ao ano, independentemente do contrato.', '2% para cada mês do período considerado.', 'Um valor fixo que não depende do saldo nem das condições.'], answer: 1, explanation: 'A taxa informada é mensal; é importante conferir o período e as condições antes de comparar ou calcular.' },
  { q: 'Qual é uma boa maneira de avaliar uma compra por impulso?', options: ['Fazer uma pausa e comparar a compra com suas prioridades.', 'Comprar antes de olhar o saldo disponível.', 'Decidir apenas porque outras pessoas compraram.'], answer: 0, explanation: 'Uma pausa permite avaliar necessidade, alternativas e impacto no orçamento antes de decidir.' },
  { q: 'Qual afirmação sobre investimentos é mais responsável?', options: ['Todo investimento tem retorno garantido.', 'Promessas de lucro alto e sem risco merecem desconfiança.', 'O risco não precisa ser considerado quando o anúncio é popular.'], answer: 1, explanation: 'Investimentos envolvem riscos. Promessas de ganhos altos e garantidos são sinais de alerta e precisam ser verificadas.' },
  { q: 'Uma compra custa R$ 90 à vista ou 3 parcelas de R$ 32. Qual é o total parcelado?', options: ['R$ 96.', 'R$ 93.', 'R$ 32.'], answer: 0, explanation: '3 × R$ 32 = R$ 96. Compare os R$ 96 parcelados com os R$ 90 à vista e confira se há outras condições.' },
  { q: 'Qual informação é mais útil ao planejar uma meta financeira?', options: ['Somente o nome da meta.', 'O valor desejado, o prazo e quanto é viável separar periodicamente.', 'Uma promessa de que o dinheiro vai se multiplicar rapidamente.'], answer: 1, explanation: 'Definir valor, prazo e contribuições possíveis torna a meta mais concreta e acompanhável.' },
  { q: 'Se os gastos planejados ultrapassam o dinheiro disponível, o que o orçamento revela?', options: ['Que é preciso revisar valores e prioridades.', 'Que o saldo negativo não importa se a compra for desejada.', 'Que todas as metas devem ser mantidas sem ajustes.'], answer: 0, explanation: 'O orçamento evidencia o desequilíbrio e ajuda a avaliar ajustes possíveis, respeitando necessidades e compromissos.' },
  { q: 'Qual é uma atitude prudente ao receber uma oferta financeira desconhecida pela internet?', options: ['Conferir a origem, pesquisar informações e evitar compartilhar dados sensíveis.', 'Enviar documentos imediatamente para não perder a oferta.', 'Confiar apenas nos depoimentos publicados no próprio anúncio.'], answer: 0, explanation: 'Verificar a origem por fontes independentes e proteger os dados reduz o risco de golpes.' },
  { q: 'A fatura do cartão é de R$ 200, mas você pensa em pagar apenas o mínimo. O que é importante entender?', options: ['O restante da fatura pode gerar juros e encargos conforme as condições do cartão.', 'O pagamento mínimo cancela automaticamente o restante da dívida.', 'Pagar o mínimo sempre custa menos do que quitar a fatura.'], answer: 0, explanation: 'O pagamento mínimo não elimina o saldo restante; podem existir juros e encargos. Confira as condições e, quando possível, planeje o pagamento integral.' },
  { q: 'Qual exemplo costuma representar um gasto variável?', options: ['Uma assinatura mensal com valor fixo.', 'O valor da conta de energia, que pode mudar conforme o consumo.', 'Uma mensalidade contratada sempre pelo mesmo valor.'], answer: 1, explanation: 'Gastos variáveis podem mudar de um período para outro. Acompanhar o histórico ajuda a planejar uma estimativa.' },
  { q: 'Por que conferir o extrato da conta com regularidade pode ser útil?', options: ['Para identificar movimentações desconhecidas e conferir cobranças.', 'Para garantir que nenhum golpe seja possível.', 'Para dispensar o cuidado com senhas e códigos.'], answer: 0, explanation: 'Acompanhar movimentações ajuda a perceber cobranças ou transações que você não reconhece; isso não substitui outros cuidados de segurança.' },
  { q: 'Ao planejar uma meta financeira, qual abordagem tende a ser mais prática?', options: ['Definir um valor e prazo possíveis e acompanhar o progresso.', 'Escolher um prazo sem considerar quanto pode separar.', 'Contar com ganhos rápidos sem verificar riscos.'], answer: 0, explanation: 'Uma meta com valor, prazo e etapas realistas facilita acompanhar o progresso e ajustar o plano quando necessário.' }
];
const QUESTIONS_PER_ROUND = 5;
let quizDeck = [];
let previousRoundQuestions = [];
let roundQuestions = [];
let quizIndex = 0;
let quizScore = 0;
let quizLocked = false;
let quizFinished = false;
function makeQuizRound() {
  if (quizDeck.length < QUESTIONS_PER_ROUND) {
    quizDeck = shuffle(quizPool);
    if (previousRoundQuestions.length) {
      const previousQuestions = new Set(previousRoundQuestions.map((question) => question.q));
      let attempts = 0;
      while (attempts < 25 && quizDeck.slice(0, QUESTIONS_PER_ROUND).some((question) => previousQuestions.has(question.q))) {
        quizDeck = shuffle(quizPool);
        attempts += 1;
      }
    }
  }
  const selectedQuestions = quizDeck.splice(0, QUESTIONS_PER_ROUND);
  previousRoundQuestions = selectedQuestions;
  roundQuestions = selectedQuestions.map((question) => {
    const options = shuffle(question.options.map((text, index) => ({ text, correct: index === question.answer })));
    return { q: question.q, options, answer: options.findIndex((option) => option.correct), explanation: question.explanation };
  });
  quizIndex = 0;
  quizScore = 0;
  quizLocked = false;
  quizFinished = false;
  renderQuestion();
}
function renderQuestion() {
  quizFinished = false;
  const question = roundQuestions[quizIndex];
  $('quiz-position').textContent = `Pergunta ${quizIndex + 1} de ${roundQuestions.length}`;
  $('quiz-score').textContent = `${quizScore} ${quizScore === 1 ? 'acerto' : 'acertos'}`;
  $('quiz-progress-bar').style.width = `${(quizIndex / roundQuestions.length) * 100}%`;
  $('quiz-question').textContent = question.q;
  $('quiz-options').replaceChildren();
  $('quiz-feedback').textContent = 'Selecione uma resposta.';
  $('next-question').disabled = true;
  $('next-question').textContent = quizIndex === roundQuestions.length - 1 ? 'Ver resultado' : 'Próxima pergunta →';
  quizLocked = false;
  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.className = 'opt-button';
    button.textContent = option.text;
    button.addEventListener('click', () => answerQuestion(index, button));
    $('quiz-options').appendChild(button);
  });
}
function answerQuestion(selectedIndex, selectedButton) {
  if (quizLocked) return;
  quizLocked = true;
  const question = roundQuestions[quizIndex];
  const buttons = [...$('quiz-options').querySelectorAll('button')];
  buttons.forEach((button) => { button.disabled = true; });
  buttons[question.answer].classList.add('correct');
  if (selectedIndex === question.answer) {
    quizScore += 1;
    selectedButton.classList.add('correct');
    $('quiz-feedback').textContent = `Isso mesmo! ${question.explanation}`;
  } else {
    selectedButton.classList.add('incorrect');
    $('quiz-feedback').textContent = `Vamos aprender com essa tentativa. ${question.explanation}`;
  }
  $('quiz-score').textContent = `${quizScore} ${quizScore === 1 ? 'acerto' : 'acertos'}`;
  $('next-question').disabled = false;
}
$('next-question').addEventListener('click', () => {
  if (quizFinished) { makeQuizRound(); return; }
  if (!quizLocked) return;
  if (quizIndex < roundQuestions.length - 1) {
    quizIndex += 1;
    renderQuestion();
  } else {
    progress.answered = true;
    progress.quizBest = Math.max(progress.quizBest, quizScore);
    progress.xp += quizScore * 5;
    saveProgress();
    $('quiz-position').textContent = 'Rodada concluída';
    $('quiz-progress-bar').style.width = '100%';
    $('quiz-question').textContent = `Você acertou ${quizScore} de ${roundQuestions.length} perguntas.`;
    $('quiz-options').replaceChildren();
    $('quiz-feedback').textContent = quizScore === roundQuestions.length
      ? 'Excelente! Você demonstrou compreender os conceitos desta rodada.'
      : 'Cada rodada traz perguntas diferentes. Leia as explicações e tente novamente para praticar.';
    $('next-question').textContent = 'Nova rodada';
    $('next-question').disabled = false;
    quizFinished = true;
  }
});

renderProgress();
updateBudget();
calculateInterest();
renderChallenge();
makeQuizRound();
})();
