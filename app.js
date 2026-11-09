'use strict';

const TOPICS = [
  { id: 'addition', label: 'Addition' },
  { id: 'subtraction', label: 'Subtraction' },
  { id: 'multiplication', label: 'Multiplication' },
  { id: 'division', label: 'Division' },
  { id: 'percentages', label: 'Percentages' },
  { id: 'averages', label: 'Averages' },
  { id: 'fractions', label: 'Fractions' },
  { id: 'decimals', label: 'Decimals' },
  { id: 'ratios', label: 'Ratios' },
  { id: 'bodmas', label: 'Simplification' }
];

const LEVELS = [
  { value: 1, label: 'Level 1 - Beginner' },
  { value: 2, label: 'Level 2 - Easy' },
  { value: 3, label: 'Level 3 - Intermediate' },
  { value: 4, label: 'Level 4 - Advanced' },
  { value: 5, label: 'Level 5 - Expert' }
];

const MODES = {
  quick: { label: 'Quick test', seconds: 60, count: 10 },
  speed: { label: 'Speed test', seconds: 30, count: 20 },
  accuracy: { label: 'Accuracy test', seconds: 300, count: 20 },
  mixed: { label: 'Mixed test', seconds: 120, count: 20 }
};

const EXAM_PRESETS = {
  jee: { title: 'JEE-level calculation test', level: 5 },
  ssc: { title: 'SSC-level calculation test', level: 3 }
};

const EXAM_SUBJECTS = {
  jee: [
    { id: 'jee-mathematics', label: 'Mathematics' },
    { id: 'jee-physics', label: 'Physics' },
    { id: 'jee-chemistry', label: 'Chemistry' }
  ],
  ssc: [
    { id: 'ssc-quantitative', label: 'Quantitative Aptitude' },
    { id: 'ssc-reasoning', label: 'Reasoning' },
    { id: 'ssc-english', label: 'English' },
    { id: 'ssc-awareness', label: 'General Awareness' }
  ]
};

const SUBJECT_QUESTIONS = window.DHARMA_SUBJECT_QUESTIONS;

const STORAGE_KEY = 'project-dharma:v1';
const SUBJECT_PROGRESS_KEY = 'project-dharma:subject-rounds:v1';
const state = { mode: 'quick', examTitle: null, examId: null, subjectId: null, test: null, practice: null, timerId: null, toastId: null };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const gcd = (a, b) => b === 0 ? Math.abs(a) : gcd(b, a % b);

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sessions: [] };
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.sessions) ? parsed : { sessions: [] };
  } catch (error) {
    console.error('Unable to read saved PROJECT DHARMA progress.', error);
    return { sessions: [] };
  }
}

function writeStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Unable to save PROJECT DHARMA progress.', error);
    showToast('Progress could not be saved in this browser.');
    return false;
  }
}

function loadSubjectQuestions(subjectId) {
  return SUBJECT_QUESTIONS[subjectId] || [];
}

function getNextSubjectQuestion(test) {
  let progress = {};
  try {
    const raw = localStorage.getItem(SUBJECT_PROGRESS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Saved subject progress has an invalid format.');
    progress = parsed;
  } catch (error) {
    console.error('Unable to read saved subject-question progress.', error);
    if (!test.progressWarningShown) {
      test.progressWarningShown = true;
      showToast('No-repeat progress could not be read from this browser.');
    }
  }

  const recorded = new Set(Array.isArray(progress[test.subjectId]) ? progress[test.subjectId].filter((item) => typeof item === 'string') : []);
  const available = () => test.subjectQuestions
    .map((question, index) => ({ question, index, key: question.prompt.trim().toLocaleLowerCase() }))
    .filter((item) => !test.seen.has(item.index) && !recorded.has(item.key));
  let candidates = available();
  let newRound = false;
  if (!candidates.length && !test.seen.size) {
    newRound = recorded.size > 0;
    recorded.clear();
    candidates = available();
  }
  if (!candidates.length) return null;

  const selected = candidates[randInt(0, candidates.length - 1)];
  test.seen.add(selected.index);
  recorded.add(selected.key);
  progress[test.subjectId] = [...recorded];
  try {
    localStorage.setItem(SUBJECT_PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Unable to save subject-question progress.', error);
    if (!test.progressWarningShown) {
      test.progressWarningShown = true;
      showToast('No-repeat progress could not be saved in this browser.');
    }
  }
  return { question: selected.question, newRound };
}

function topicById(id) {
  return TOPICS.find((topic) => topic.id === id) || TOPICS[0];
}

function subjectById(id) {
  for (const [exam, subjects] of Object.entries(EXAM_SUBJECTS)) {
    const subject = subjects.find((item) => item.id === id);
    if (subject) return { ...subject, exam };
  }
  return null;
}

function practiceLabelById(id) {
  return subjectById(id)?.label || topicById(id).label;
}

function randomOperands(topic, level) {
  const small = [10, 25, 99, 999, 9999][level - 1];
  const bigger = [10, 99, 999, 9999, 99999][level - 1];
  let a = randInt(level === 1 ? 1 : Math.floor(small / 2), small);
  let b = randInt(1, Math.max(2, Math.floor(small / 2)));
  if (topic === 'multiplication') {
    const max = [12, 20, 99, 250, 999][level - 1];
    a = randInt(2, max);
    b = randInt(2, level < 3 ? 12 : max);
  } else if (topic === 'addition') {
    a = randInt(1, bigger);
    b = randInt(1, bigger);
  } else if (topic === 'subtraction') {
    a = randInt(1, bigger);
    b = randInt(1, bigger);
    if (level < 4 && b > a) [a, b] = [b, a];
  } else if (topic === 'division') {
    b = randInt(2, [10, 12, 30, 99, 200][level - 1]);
    a = b * randInt(2, [12, 25, 99, 999, 9999][level - 1]);
  }
  return [a, b];
}

function mentalMathTip(topic, values = {}) {
  if (topic === 'addition') return 'Number ko nearest 10/100 tak le jaane ke liye chhota adjustment karo, phir utna hi wapas ghatao.';
  if (topic === 'subtraction') return 'Ghataane wale number ko aasaan 10 ke paas round karo, phir chhota difference adjust karo.';
  if (topic === 'multiplication') return values.b % 2 === 0
    ? 'Ek number ko aadha aur doosre ko dugna karke dekho—guna ka jawab wahi rahega.'
    : 'Ek number ko tens aur ones mein baanto; dono ke guna karke jod do.';
  if (topic === 'division') return 'Divisor ka aasaan multiple dhoondo; dividend ko usse compare karke divide karo.';
  if (topic === 'percentages') {
    const tips = {
      5: '10% nikaalo, phir uska aadha kar do.',
      10: '10% ke liye number ka decimal ek jagah baayein le jao.',
      20: '10% nikaalo aur usse dugna kar do.',
      25: '25% ka matlab number ka chautha hissa—4 se divide karo.',
      50: '50% ka matlab number ka aadha.',
      75: '75% nikaalne ke liye number ka 3/4 lo: pehle 4 se baanto, phir 3 se guna.'
    };
    return tips[values.percent] || 'Percent ko 100 mein se hissa samjho; pehle 10% nikaalna madad karta hai.';
  }
  if (topic === 'averages') return 'Beech ke aas-paas ek number ko base banao; baaki numbers ka fark jodkar count se baanto.';
  if (topic === 'fractions') return 'Denominator same hai: sirf numerator jodo ya ghatao, denominator wahi rakho.';
  if (topic === 'decimals') return 'Decimal points ko ek line mein socho; pehle whole numbers ki tarah calculate karo.';
  if (topic === 'ratios') return 'Ratio ke dono parts ek hi factor se badalte hain—pehle pair ka factor dhoondo, phir wahi lagao.';
  return 'BODMAS yaad rakho: pehle guna, phir jod. Guna ko aasaan parts mein tod sakte ho.';
}

function makeQuestion(topicId, level) {
  const id = topicById(topicId).id;
  const [a, b] = randomOperands(id, level);
  if (id === 'addition') return { topic: id, prompt: `${a} + ${b}`, answer: a + b, explanation: `${a} + ${b} = ${a + b}`, tip: mentalMathTip(id) };
  if (id === 'subtraction') return { topic: id, prompt: `${a} - ${b}`, answer: a - b, explanation: `${a} - ${b} = ${a - b}`, tip: mentalMathTip(id) };
  if (id === 'multiplication') return { topic: id, prompt: `${a} x ${b}`, answer: a * b, explanation: `${a} x ${b} = ${a * b}`, tip: mentalMathTip(id, { b }) };
  if (id === 'division') return { topic: id, prompt: `${a} / ${b}`, answer: a / b, explanation: `${a} / ${b} = ${a / b}`, tip: mentalMathTip(id) };
  if (id === 'percentages') {
    const percents = [5, 10, 20, 25, 50, 75];
    const percent = percents[randInt(0, level < 3 ? 3 : percents.length - 1)];
    const base = randInt(2, [20, 100, 500, 2000, 10000][level - 1]);
    const answer = round2(base * percent / 100);
    return { topic: id, prompt: `${percent}% of ${base}`, answer, explanation: `${percent}% means ${percent}/100. ${base} x ${percent}/100 = ${answer}.`, tip: mentalMathTip(id, { percent }) };
  }
  if (id === 'averages') {
    const count = randInt(3, level < 3 ? 4 : 6);
    const values = Array.from({ length: count }, () => randInt(1, [12, 50, 200, 999, 5000][level - 1]));
    const remainder = values.reduce((total, value) => total + value, 0) % count;
    const last = values[count - 1];
    values[count - 1] = remainder === 0 ? last : last > remainder ? last - remainder : last + count - remainder;
    const sum = values.reduce((total, value) => total + value, 0);
    return { topic: id, prompt: `Average: ${values.join(', ')}`, answer: sum / count, explanation: `Add the numbers (${sum}), then divide by ${count}: ${sum} / ${count} = ${sum / count}.`, tip: mentalMathTip(id) };
  }
  if (id === 'fractions') {
    const denominator = randInt(2, [5, 10, 12, 20, 25][level - 1]);
    const n1 = randInt(1, denominator - 1);
    const n2 = randInt(1, denominator - 1);
    const sign = Math.random() < .5 ? '+' : '-';
    const numerator = sign === '+' ? n1 + n2 : n1 - n2;
    const divisor = gcd(numerator, denominator) || 1;
    const reduced = `${numerator / divisor}/${denominator / divisor}`;
    return { topic: id, prompt: `${n1}/${denominator} ${sign} ${n2}/${denominator}`, answer: numerator / denominator, acceptedFraction: reduced, explanation: `The denominators match, so ${n1}/${denominator} ${sign} ${n2}/${denominator} = ${numerator}/${denominator}${divisor > 1 ? ` = ${reduced}` : ''}.`, tip: mentalMathTip(id) };
  }
  if (id === 'decimals') {
    const left = round2(randInt(1, [99, 999, 9999, 99999, 999999][level - 1]) / 10);
    const right = round2(randInt(1, [99, 999, 9999, 99999, 999999][level - 1]) / 10);
    const sign = Math.random() < .5 ? '+' : '-';
    const answer = round2(sign === '+' ? left + right : left - right);
    return { topic: id, prompt: `${left.toFixed(1)} ${sign} ${right.toFixed(1)}`, answer, explanation: `${left.toFixed(1)} ${sign} ${right.toFixed(1)} = ${answer}.`, tip: mentalMathTip(id) };
  }
  if (id === 'ratios') {
    const multiplier = randInt(2, [5, 10, 20, 50, 100][level - 1]);
    const first = randInt(1, [5, 12, 25, 100, 999][level - 1]);
    const second = randInt(1, [5, 12, 25, 100, 999][level - 1]);
    return { topic: id, prompt: `${first}:${second} = ${first * multiplier}:?`, answer: second * multiplier, explanation: `The first part is multiplied by ${multiplier}, so multiply the second part too: ${second} x ${multiplier} = ${second * multiplier}.`, tip: mentalMathTip(id) };
  }
  const left = randInt(2, [12, 25, 99, 500, 999][level - 1]);
  const middle = randInt(2, [9, 15, 50, 99, 300][level - 1]);
  const right = randInt(1, [9, 20, 99, 500, 999][level - 1]);
  return { topic: id, prompt: `${left} + ${middle} x ${right}`, answer: left + middle * right, explanation: `Multiply first: ${middle} x ${right} = ${middle * right}. Then add ${left}, giving ${left + middle * right}.`, tip: mentalMathTip(id) };
}

function safeNumberAnswer(raw) {
  const value = raw.trim().replace(',', '.');
  if (!/^-?(?:\d+\.?\d*|\.\d+)(?:\/-?\d+)?$/.test(value)) return null;
  if (value.includes('/')) {
    const [numerator, denominator] = value.split('/').map(Number);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
    return numerator / denominator;
  }
  const answer = Number(value);
  return Number.isFinite(answer) ? answer : null;
}

function isCorrect(question, raw) {
  const parsed = safeNumberAnswer(raw);
  if (parsed === null) return false;
  return raw.trim() === question.acceptedFraction || Math.abs(parsed - question.answer) < 0.000001;
}

function nextUniqueQuestion(topicIds, level, seen) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const question = makeQuestion(topicIds[randInt(0, topicIds.length - 1)], level);
    const key = `${question.topic}|${question.prompt}`;
    if (!seen.has(key)) {
      seen.add(key);
      return question;
    }
  }
  const question = makeQuestion(topicIds[randInt(0, topicIds.length - 1)], level);
  seen.add(`${question.topic}|${question.prompt}`);
  return question;
}

function formatDuration(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatClock(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(state.toastId);
  state.toastId = setTimeout(() => toast.classList.remove('visible'), 2800);
}

function setMode(mode) {
  state.mode = mode;
  $$('.mode-card').forEach((button) => button.classList.toggle('selected', button.dataset.mode === mode));
  const preset = MODES[mode];
  if ($('#question-count-wrap')) $('#question-count-wrap').classList.toggle('is-hidden', mode !== 'custom');
  if (preset) {
    $('#question-count').value = preset.count;
    $('#question-count-value').textContent = String(preset.count);
    $('#test-duration').value = String(preset.seconds);
    $('#test-topic').disabled = mode === 'mixed';
  } else {
    $('#test-topic').disabled = false;
  }
}

function chosenDuration() {
  const value = $('#test-duration').value;
  if (value !== 'custom') return Number(value);
  const minutes = Number($('#custom-duration').value);
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 120) {
    showToast('Choose a custom duration between 1 and 120 minutes.');
    $('#custom-duration').focus();
    return null;
  }
  return Math.round(minutes * 60);
}

async function startTest(subjectId = null, isPractice = false) {
  const subject = subjectId ? subjectById(subjectId) : null;
  const subjectQuestions = subject ? await loadSubjectQuestions(subjectId) : null;
  if (subject && (!subjectQuestions || !subjectQuestions.length)) {
    showToast('This subject practice is not available yet.');
    return;
  }
  const seconds = subject ? (isPractice ? 0 : 300) : chosenDuration();
  if (!seconds && !isPractice) return;
  const topicIds = subject ? [subject.id] : state.mode === 'mixed' ? TOPICS.map((topic) => topic.id) : [$('#test-topic').value];
  const limit = subject ? (isPractice ? subjectQuestions.length : Math.min(5, subjectQuestions.length)) : Number($('#question-count').value);
  const level = subject ? EXAM_PRESETS[subject.exam].level : Number($('#test-level').value);
  const test = {
    mode: state.mode,
    title: subject ? `${subject.exam.toUpperCase()} ${subject.label} ${isPractice ? 'practice' : 'test'}` : state.examTitle || (state.mode === 'custom' ? 'Custom test' : MODES[state.mode].label),
    topicIds,
    level,
    subjectId: subject?.id || null,
    subjectQuestions,
    isPractice,
    questionsShown: 0,
    limit,
    duration: seconds,
    startedAt: Date.now(),
    deadline: isPractice ? null : Date.now() + seconds * 1000,
    correct: 0,
    incorrect: 0,
    skipped: 0,
    streak: 0,
    highestStreak: 0,
    topicStats: {},
    seen: new Set(),
    current: null,
    locked: false,
    progressWarningShown: false
  };
  state.test = test;
  $('#test-session').classList.remove('is-hidden');
  $('#test-session').classList.toggle('subject-question-mode', Boolean(subject));
  $('#test-session').classList.toggle('untimed-practice-mode', isPractice);
  $('#test-results').classList.add('is-hidden');
  $('#session-title').textContent = test.title;
  $('#session-level-label').textContent = `LEVEL ${test.level}`;
  $('#session-topic-label').textContent = subject ? subject.label.toUpperCase() : topicIds.length > 1 ? 'MIXED CALCULATIONS' : topicById(topicIds[0]).label.toUpperCase();
  $('#quit-test').textContent = isPractice ? '× Exit practice' : '× End test';
  $('#answer-instructions').textContent = isPractice ? 'Choose an answer to see the explanation' : subject ? 'Choose the best answer' : 'Press Enter to submit';
  $('#answered-display').textContent = `0 / ${test.limit}`;
  $('#streak-display').textContent = '0';
  $('#live-accuracy').textContent = '--';
  $('#answer-feedback').textContent = '';
  $('#answer-feedback').classList.remove('incorrect');
  renderNextQuestion();
  clearInterval(state.timerId);
  if (!isPractice) {
    state.timerId = setInterval(updateTimer, 200);
    updateTimer();
  } else {
    state.timerId = null;
    $('#timer-display').textContent = '—';
  }
  $('#test-session').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function renderNextQuestion() {
  const test = state.test;
  if (!test || test.locked) return;
  if (test.correct + test.incorrect + test.skipped >= test.limit) {
    finishTest(test.isPractice && test.subjectId ? 'bank' : 'complete');
    return;
  }
  if (test.subjectId) {
    const next = getNextSubjectQuestion(test);
    if (!next) {
      finishTest(test.isPractice ? 'bank' : 'complete');
      return;
    }
    test.current = { ...next.question, topic: test.subjectId };
    if (next.newRound) showToast('All questions were used. A new round has started.');
  } else {
    test.current = nextUniqueQuestion(test.topicIds, test.level, test.seen);
  }
  $('#question-prompt').textContent = test.subjectId ? test.current.prompt : `${test.current.prompt} = ?`;
  $('#question-tip-title').textContent = test.subjectId ? 'QUICK SOLVING TIP' : 'MENTAL MATH TIP';
  $('#question-tip').textContent = test.current.tip;
  test.questionsShown += 1;
  $('#question-counter').textContent = test.isPractice
    ? `PRACTICE QUESTION ${test.questionsShown}`
    : `QUESTION ${test.correct + test.incorrect + test.skipped + 1} OF ${test.limit}`;
  $('#question-progress').style.width = `${((test.correct + test.incorrect + test.skipped) / test.limit) * 100}%`;
  $('#answer-input').value = '';
  $('#subject-options').classList.toggle('is-hidden', !test.subjectId);
  $('#answer-form').classList.toggle('is-hidden', Boolean(test.subjectId));
  if (test.subjectId) {
    $('#subject-options').innerHTML = test.current.options.map((option, index) =>
      `<button class="subject-answer-option" type="button" data-answer="${index}">${escapeHTML(option)}</button>`
    ).join('');
    $$('.subject-answer-option').forEach((button) => button.addEventListener('click', () => submitSubjectAnswer(Number(button.dataset.answer))));
  }
  $('#answer-feedback').textContent = '';
  $('#answer-feedback').classList.remove('incorrect');
  if (!test.subjectId) $('#answer-input').focus({ preventScroll: true });
}

function updateLiveStats() {
  const test = state.test;
  if (!test) return;
  const answered = test.correct + test.incorrect;
  const total = answered + test.skipped;
  $('#answered-display').textContent = `${total} / ${test.limit}`;
  $('#streak-display').textContent = String(test.streak);
  $('#live-accuracy').textContent = answered ? `${Math.round(test.correct / answered * 100)}%` : '--';
}

function recordQuestion(correct, skipped = false) {
  const test = state.test;
  if (!test || test.locked || !test.current) return;
  const topic = test.current.topic;
  if (!test.topicStats[topic]) test.topicStats[topic] = { correct: 0, incorrect: 0, skipped: 0 };
  if (skipped) {
    test.skipped += 1;
    test.topicStats[topic].skipped += 1;
    test.streak = 0;
  } else if (correct) {
    test.correct += 1;
    test.topicStats[topic].correct += 1;
    test.streak += 1;
    test.highestStreak = Math.max(test.highestStreak, test.streak);
  } else {
    test.incorrect += 1;
    test.topicStats[topic].incorrect += 1;
    test.streak = 0;
  }
  updateLiveStats();
}

function submitTestAnswer(event) {
  event.preventDefault();
  const test = state.test;
  if (!test || test.locked) return;
  const input = $('#answer-input');
  const raw = input.value.trim();
  if (!raw) {
    $('#answer-feedback').textContent = 'Enter an answer, or skip this question.';
    $('#answer-feedback').classList.add('incorrect');
    input.focus();
    return;
  }
  const correct = isCorrect(test.current, raw);
  recordQuestion(correct);
  const feedback = $('#answer-feedback');
  feedback.textContent = correct ? 'Correct. Keep going!' : `Not quite. ${test.current.explanation}`;
  feedback.classList.toggle('incorrect', !correct);
  test.locked = true;
  setTimeout(() => {
    if (state.test !== test) return;
    test.locked = false;
    renderNextQuestion();
  }, correct ? 350 : 1100);
}

function submitSubjectAnswer(selectedAnswer) {
  const test = state.test;
  if (!test || test.locked || !test.current) return;
  const correct = selectedAnswer === test.current.answer;
  recordQuestion(correct);
  const feedback = $('#answer-feedback');
  feedback.textContent = `${correct ? 'Correct!' : `Not quite. The correct answer is ${test.current.options[test.current.answer]}.`} ${test.current.explanation}`;
  feedback.classList.toggle('incorrect', !correct);
  $$('.subject-answer-option').forEach((button) => {
    button.disabled = true;
    if (Number(button.dataset.answer) === test.current.answer) button.classList.add('answer-correct');
    else if (Number(button.dataset.answer) === selectedAnswer) button.classList.add('answer-incorrect');
  });
  test.locked = true;
  setTimeout(() => {
    if (state.test !== test) return;
    test.locked = false;
    renderNextQuestion();
  }, 1400);
}

function skipQuestion() {
  if (!state.test || state.test.locked) return;
  recordQuestion(false, true);
  renderNextQuestion();
}

function updateTimer() {
  const test = state.test;
  if (!test || test.isPractice) return;
  const remaining = Math.max(0, Math.ceil((test.deadline - Date.now()) / 1000));
  $('#timer-display').textContent = formatDuration(remaining);
  $('#timer-progress').style.width = `${Math.max(0, remaining / test.duration * 100)}%`;
  $('#timer-display').style.color = remaining <= 10 ? 'var(--red)' : 'var(--gold)';
  if (remaining <= 0) finishTest('time');
}

function finishTest(reason) {
  const test = state.test;
  if (!test) return;
  clearInterval(state.timerId);
  state.timerId = null;
  test.locked = true;
  const elapsedSeconds = Math.max(1, Math.round((Date.now() - test.startedAt) / 1000));
  const elapsed = test.duration ? Math.min(test.duration, elapsedSeconds) : elapsedSeconds;
  const answered = test.correct + test.incorrect;
  const total = answered + test.skipped;
  const result = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    mode: test.title,
    level: test.level,
    correct: test.correct,
    incorrect: test.incorrect,
    skipped: test.skipped,
    total,
    answered,
    accuracy: answered ? Math.round(test.correct / answered * 100) : 0,
    elapsed,
    average: answered ? Math.round(elapsed / answered * 10) / 10 : 0,
    perMinute: Math.round(test.correct / (elapsed / 60) * 10) / 10,
    highestStreak: test.highestStreak,
    topicStats: test.topicStats
  };
  const store = readStore();
  store.sessions.unshift(result);
  store.sessions = store.sessions.slice(0, 100);
  result.personalBest = Math.max(...store.sessions.map((session) => session.accuracy));
  writeStore(store);
  renderRecentSessions();
  state.test = null;
  $('#test-session').classList.add('is-hidden');
  $('#test-results').classList.remove('is-hidden');
  renderResults(result, reason);
  $('#test-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resultStat(label, value, extraClass = '') {
  return `<div class="result-stat"><small>${label}</small><b class="${extraClass}">${value}</b></div>`;
}

function renderResults(result, reason) {
  $('#result-title').textContent = result.accuracy >= 80 && result.answered > 0 ? 'Excellent focus.' : result.answered > 0 ? 'Good work.' : 'Session complete.';
  $('#result-subtitle').textContent = reason === 'time'
    ? 'Time is up. Here is how your session went.'
    : reason === 'bank'
      ? 'You reached the end of this question bank. No questions were repeated.'
      : 'Every question is a chance to improve.';
  $('#result-stats').innerHTML = [
    resultStat('QUESTIONS ANSWERED', result.answered),
    resultStat('CORRECT', result.correct, 'positive'),
    resultStat('INCORRECT', result.incorrect),
    resultStat('SKIPPED', result.skipped),
    resultStat('ACCURACY', `${result.accuracy}%`),
    resultStat('TIME USED', formatClock(result.elapsed)),
    resultStat('AVG. TIME / ANSWER', result.answered ? `${result.average}s` : '--'),
    resultStat('CORRECT / MIN', result.perMinute),
    resultStat('PERSONAL BEST ACCURACY', `${result.personalBest}%`),
    resultStat('HIGHEST STREAK', result.highestStreak)
  ].join('');
  $('#topic-breakdown').innerHTML = Object.entries(result.topicStats).map(([id, stats]) => {
    const count = stats.correct + stats.incorrect + stats.skipped;
    const answered = stats.correct + stats.incorrect;
    const accuracy = answered ? Math.round(stats.correct / answered * 100) : 0;
    return `<div class="topic-bar-row"><span>${escapeHTML(practiceLabelById(id))}</span><div class="topic-bar"><span style="width:${accuracy}%"></span></div><small>${count ? `${accuracy}%` : '--'}</small></div>`;
  }).join('') || '<p class="empty-history">No questions were recorded in this session.</p>';
}

function renderRecentSessions() {
  const root = $('#recent-sessions');
  if (!root) return;
  const sessions = readStore().sessions.slice(0, 3);
  if (!sessions.length) {
    root.innerHTML = '<div class="empty-history">Your completed tests will show up here.</div>';
    return;
  }
  root.innerHTML = sessions.map((session) => {
    const date = new Date(session.date);
    const dateText = Number.isNaN(date.getTime()) ? 'Saved session' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `<div class="recent-item"><span class="recent-icon">&#10003;</span><span class="recent-info"><b>${escapeHTML(session.mode)}</b><small>${dateText} &middot; ${session.correct} correct of ${session.answered} answered</small></span><span class="recent-score">${session.accuracy}%</span></div>`;
  }).join('');
}

function renderDashboard() {
  const summary = $('#progress-summary');
  if (!summary) return;
  const sessions = readStore().sessions;
  if (!sessions.length) {
    summary.innerHTML = ['TESTS COMPLETED', 'QUESTIONS ANSWERED', 'BEST ACCURACY', 'BEST STREAK'].map((label) => `<div class="summary-card"><span>${label}</span><b>&mdash;</b></div>`).join('');
    $('#accuracy-chart').innerHTML = '<div class="no-history">Complete a test to start your accuracy trend.</div>';
    $('#history-table').innerHTML = '<div class="no-history">Your real test results will appear here after your first completed test.</div>';
    return;
  }
  const answered = sessions.reduce((sum, item) => sum + item.answered, 0);
  summary.innerHTML = [
    ['TESTS COMPLETED', sessions.length],
    ['QUESTIONS ANSWERED', answered],
    ['BEST ACCURACY', `${Math.max(...sessions.map((item) => item.accuracy))}%`],
    ['BEST STREAK', Math.max(...sessions.map((item) => item.highestStreak))]
  ].map(([label, value]) => `<div class="summary-card"><span>${label}</span><b>${value}</b></div>`).join('');
  const trend = sessions.slice(0, 7).reverse();
  const points = trend.map((session, index) => {
    const x = trend.length === 1 ? 300 : 34 + index * (532 / (trend.length - 1));
    return { x, y: 142 - session.accuracy * 1.08, label: new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), accuracy: session.accuracy };
  });
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const dots = points.map((point) => `<circle class="chart-dot" cx="${point.x}" cy="${point.y}" r="5"><title>${escapeHTML(point.label)}: ${point.accuracy}% accuracy</title></circle>`).join('');
  const labels = points.map((point) => `<text x="${point.x}" y="165" text-anchor="middle">${escapeHTML(point.label)}</text>`).join('');
  $('#accuracy-chart').innerHTML = `<svg class="accuracy-chart" viewBox="0 0 600 176" role="img" aria-label="Accuracy trend across the last ${points.length} completed tests"><line class="chart-gridline" x1="30" y1="34" x2="585" y2="34"></line><line class="chart-gridline" x1="30" y1="88" x2="585" y2="88"></line><line class="chart-gridline" x1="30" y1="142" x2="585" y2="142"></line><text x="0" y="37">100%</text><text x="8" y="91">50%</text><text x="18" y="145">0%</text><path class="chart-line" d="${line}"></path>${dots}${labels}</svg>`;
  const rows = sessions.slice(0, 10).map((session) => {
    const date = new Date(session.date);
    const dateText = Number.isNaN(date.getTime()) ? 'Saved session' : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    return `<tr><td>${escapeHTML(session.mode)}</td><td>${dateText}</td><td>${session.correct} / ${session.answered}</td><td><span class="accuracy-pill">${session.accuracy}%</span></td><td>${formatClock(session.elapsed)}</td></tr>`;
  }).join('');
  $('#history-table').innerHTML = `<div class="table-wrap"><table><thead><tr><th>SESSION</th><th>DATE</th><th>CORRECT / ANSWERED</th><th>ACCURACY</th><th>TIME</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function startPractice() {
  state.practice = { topic: $('#practice-topic').value, level: Number($('#practice-level').value), seen: new Set(), question: null, waiting: false };
  showPracticeQuestion();
  $('#practice-workspace').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showPracticeQuestion() {
  const practice = state.practice;
  if (!practice) return;
  practice.question = nextUniqueQuestion([practice.topic], practice.level, practice.seen);
  practice.waiting = false;
  $('#practice-workspace').innerHTML = `<div class="practice-question"><span class="panel-kicker">${topicById(practice.topic).label.toUpperCase()} &middot; LEVEL ${practice.level}</span><div class="practice-expression">${escapeHTML(practice.question.prompt)} <span>= ?</span></div><p class="question-tip"><b>MENTAL MATH TIP</b><span>${escapeHTML(practice.question.tip)}</span></p><form class="practice-answer" id="practice-answer-form"><label class="visually-hidden" for="practice-answer-input">Your answer</label><input id="practice-answer-input" type="text" inputmode="decimal" placeholder="Your answer" autocomplete="off" /><button class="button button-primary" type="submit">Check <span aria-hidden="true">&rarr;</span></button></form><div class="practice-feedback" id="practice-feedback" aria-live="polite"></div><button type="button" class="button button-quiet practice-next is-hidden" id="practice-next">Next question <span aria-hidden="true">&rarr;</span></button></div>`;
  $('#practice-answer-form').addEventListener('submit', checkPracticeAnswer);
  $('#practice-next').addEventListener('click', showPracticeQuestion);
  $('#practice-answer-input').focus({ preventScroll: true });
}

function checkPracticeAnswer(event) {
  event.preventDefault();
  const practice = state.practice;
  if (!practice || practice.waiting) return;
  const input = $('#practice-answer-input');
  const raw = input.value.trim();
  const feedback = $('#practice-feedback');
  if (!raw) {
    feedback.textContent = 'Enter an answer to check it.';
    feedback.className = 'practice-feedback incorrect';
    input.focus();
    return;
  }
  practice.waiting = true;
  feedback.textContent = isCorrect(practice.question, raw)
    ? `Correct! ${practice.question.explanation}`
    : `The correct answer is ${practice.question.answer}. ${practice.question.explanation}`;
  feedback.className = `practice-feedback ${isCorrect(practice.question, raw) ? 'correct' : 'incorrect'}`;
  input.disabled = true;
  $('#practice-answer-form button').disabled = true;
  $('#practice-next').classList.remove('is-hidden');
  $('#practice-next').focus();
}

function bindNavigation() {
  const toggle = $('#menu-toggle');
  const nav = $('#main-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  $$('#main-nav a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

function bindTestPage() {
  const topicOptions = TOPICS.map((topic) => `<option value="${topic.id}">${topic.label}</option>`).join('');
  const levelOptions = LEVELS.map((level) => `<option value="${level.value}">${level.label}</option>`).join('');
  $('#test-topic').innerHTML = topicOptions;
  $('#test-level').innerHTML = levelOptions;
  const requestedTopic = new URLSearchParams(location.search).get('topic');
  if (TOPICS.some((topic) => topic.id === requestedTopic)) $('#test-topic').value = requestedTopic;
  $$('.mode-card').forEach((button) => button.addEventListener('click', () => {
    state.examTitle = null;
    $('#test-config .exam-preset-note').classList.add('is-hidden');
    setMode(button.dataset.mode);
  }));
  $('#test-level').addEventListener('change', () => {
    state.examTitle = null;
    $('#test-config .exam-preset-note').classList.add('is-hidden');
  });
  $('#question-count').addEventListener('input', (event) => { $('#question-count-value').textContent = event.target.value; });
  $('#test-duration').addEventListener('change', (event) => $('#custom-duration-wrap').classList.toggle('is-hidden', event.target.value !== 'custom'));
  $('#start-test').addEventListener('click', () => startTest());
  $('#start-subject-practice').addEventListener('click', () => startTest(state.subjectId, true));
  $('#start-subject-test').addEventListener('click', () => startTest(state.subjectId));
  $('#answer-form').addEventListener('submit', submitTestAnswer);
  $('#skip-question').addEventListener('click', skipQuestion);
  $('#quit-test').addEventListener('click', () => {
    if (!state.test?.isPractice) {
      finishTest('quit');
      return;
    }
    state.test = null;
    $('#test-session').classList.add('is-hidden');
    $('#test-results').classList.add('is-hidden');
    $('#test-config').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('#test-again').addEventListener('click', () => {
    if (state.subjectId && state.examId) {
      location.href = `./test.html?exam=${state.examId}`;
      return;
    }
    $('#test-results').classList.add('is-hidden');
    $('#test-config').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('#test-topic').focus({ preventScroll: true });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.test) finishTest('quit');
  });
  setMode('quick');
  const exam = new URLSearchParams(location.search).get('exam');
  const examPreset = EXAM_PRESETS[exam];
  if (examPreset) {
    state.examId = exam;
    state.examTitle = examPreset.title;
    $('#test-config').classList.add('exam-mode');
    setMode('mixed');
    $('#test-level').value = String(examPreset.level);
    $('#test-config .exam-preset-note').classList.remove('is-hidden');
    $('#exam-level-label').textContent = `${exam.toUpperCase()} LEVEL`;
    $('#exam-preset-title').textContent = examPreset.title;
    $('#exam-preset-level').textContent = LEVELS[examPreset.level - 1].label;
    $('#exam-preset-description').classList.add('is-hidden');
    $('#test-page-title').textContent = `${exam.toUpperCase()} subject practice`;
    $('#test-page-description').textContent = 'Choose a subject below to practice questions from that subject.';
    const requestedSubject = new URLSearchParams(location.search).get('subject');
    const selectedSubject = EXAM_SUBJECTS[exam].find((subject) => subject.id === requestedSubject);
    state.subjectId = selectedSubject ? selectedSubject.id : null;
    $('#exam-subjects').innerHTML = EXAM_SUBJECTS[exam]
      .map((subject) => `<a class="exam-subject${subject.id === state.subjectId ? ' selected' : ''}" href="./test.html?exam=${exam}&amp;subject=${subject.id}"${subject.id === state.subjectId ? ' aria-current="page"' : ''}>${escapeHTML(subject.label)}</a>`)
      .join('');
    $('#exam-subjects-heading').textContent = state.subjectId ? 'Change subject' : `${exam.toUpperCase()} subjects`;
    $('#exam-subjects-preview').classList.remove('is-hidden');
    if (selectedSubject) {
      state.examTitle = `${examPreset.title} - ${selectedSubject.label}`;
      $('#exam-preset-title').textContent = `${exam.toUpperCase()} ${selectedSubject.label} practice`;
      $('#test-page-title').textContent = `${selectedSubject.label} practice`;
      $('#test-page-description').textContent = 'Answer subject-specific questions, review the explanation, and build your confidence.';
      $('#test-config').classList.add('subject-mode');
      $('#test-config .test-config > h3').textContent = `${selectedSubject.label} practice`;
      $('#start-test').classList.add('is-hidden');
      $('#subject-session-actions').classList.remove('is-hidden');
      $('#exam-preset-description').classList.add('is-hidden');
      $('#exam-subjects-note').textContent = 'Practice bina timer ke karein, ya 5-minute test dein. Dono mein subject ke questions aur explanations milenge.';
      $('#subject-question-source-status').textContent = `${SUBJECT_QUESTIONS[state.subjectId].length} original multiple-choice questions are included. No-repeat progress is saved in this browser.`;
    } else {
      $('#test-config .test-config > h3').textContent = `Choose a ${exam.toUpperCase()} subject`;
      $('#start-test').classList.add('is-hidden');
    }
  }
  renderRecentSessions();
}

function bindPracticePage() {
  $('#practice-topic').innerHTML = TOPICS.map((topic) => `<option value="${topic.id}">${topic.label}</option>`).join('');
  $('#practice-level').innerHTML = LEVELS.map((level) => `<option value="${level.value}">${level.label}</option>`).join('');
  const requestedTopic = new URLSearchParams(location.search).get('topic');
  if (TOPICS.some((topic) => topic.id === requestedTopic)) $('#practice-topic').value = requestedTopic;
  $('#start-practice').addEventListener('click', startPractice);
}

function bindDashboardPage() {
  renderDashboard();
  $('#clear-history').addEventListener('click', () => {
    if (!readStore().sessions.length) {
      showToast('There is no saved session history to clear.');
      return;
    }
    if (!window.confirm('Clear all saved test history from this device? This cannot be undone.')) return;
    writeStore({ sessions: [] });
    renderDashboard();
    showToast('Your saved test history has been cleared.');
  });
}

bindNavigation();
const currentPage = document.body.dataset.page;
if (currentPage === 'test') bindTestPage();
if (currentPage === 'practice') bindPracticePage();
if (currentPage === 'dashboard') bindDashboardPage();
