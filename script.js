/* ─── State ─── */
let finnishWords = [];
let swedishWords = [];

let currentFinnishWord = '';
let currentSwedishTranslation = '';
let currentSvPromptWord = '';

const fiUrl = 'finnish_words.json';
const svUrl = 'sv_words.json';

/* ─── DOM refs ─── */
const wotdSvEl = document.getElementById('wotdSv');
const wotdFiEl = document.getElementById('wotdFi');
const wotdDisplay = document.getElementById('wotdDisplay');
const newWordBtn = document.getElementById('newWordBtn');
const btnIcon = document.getElementById('btnIcon');
const errorMsg = document.getElementById('errorMsg');

const svPromptWordEl = document.getElementById('svPromptWord');
const wotdPromptWordEl = document.getElementById('wotdPromptWord');
const sentenceInput = document.getElementById('sentenceInput');
const checkBtn = document.getElementById('checkBtn');
const copySentenceBtn = document.getElementById('copySentenceBtn');
const toast = document.getElementById('toast');

/* ─── Load word lists ─── */
async function loadWordLists() {
  try {
    const [fiRes, svRes] = await Promise.all([
      fetch(fiUrl),
      fetch(svUrl),
    ]);
    finnishWords = await fiRes.json();
    swedishWords = await svRes.json();
    console.log(`Loaded ${finnishWords.length} Finnish words, ${swedishWords.length} Swedish words`);
    return true;
  } catch (err) {
    console.error('Failed to load word lists:', err);
    errorMsg.textContent = 'Failed to load word data. Please refresh the page.';
    return false;
  }
}

/* ─── Pick random word ─── */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ─── Translate via MyMemory API ─── */
async function translateFiToSv(word) {
  const url =
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=fi|sv`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.responseStatus === 200) {
      return data.responseData.translatedText;
    }
    return null;
  } catch (err) {
    console.warn('Translation failed:', err);
    return null;
  }
}

/* ─── Update Word of the Day ─── */
function updateWotdDisplay(fi, sv) {
  wotdFiEl.textContent = fi;
  wotdSvEl.textContent = sv;
}

function updateSentencePrompt(svWord, wotdWord) {
  svPromptWordEl.textContent = svWord;
  wotdPromptWordEl.textContent = wotdWord;
}

/* ─── Show/hide toast ─── */
let toastTimer = null;
function showToast(message, duration = 2000) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, duration);
}

/* ─── Core: fetch new word of the day ─── */
async function fetchNewWord() {
  // disable button, show spinner
  newWordBtn.disabled = true;
  btnIcon.classList.add('spinning');
  wotdDisplay.classList.add('loading');
  errorMsg.textContent = '';

  // pick new Finnish word
  const fi = pickRandom(finnishWords);
  currentFinnishWord = fi;

  // show the finnish word immediately
  wotdFiEl.textContent = fi;
  wotdSvEl.textContent = '…';

  // translate
  const sv = await translateFiToSv(fi);

  if (sv) {
    currentSwedishTranslation = sv;
    updateWotdDisplay(fi, sv);
  } else {
    // fallback: show finnish word only with a note
    currentSwedishTranslation = fi;
    updateWotdDisplay(fi, fi);
    errorMsg.textContent = 'Translation unavailable — showing Finnish word.';
  }

  // pick new Swedish practice word
  currentSvPromptWord = pickRandom(swedishWords);
  updateSentencePrompt(currentSvPromptWord, currentSwedishTranslation);

  // re-enable button
  newWordBtn.disabled = false;
  btnIcon.classList.remove('spinning');
  wotdDisplay.classList.remove('loading');
}

/* ─── Clipbard: copy prompt + sentence ─── */
async function copyCheckPrompt() {
  const sentence = sentenceInput.value.trim();
  if (!sentence) {
    showToast('Please write a sentence first.', 2000);
    return;
  }

  const text = `You are a Swedish language tutor. Review the user's Swedish sentence for grammar, word usage, and naturalness. If there is a mistake, explain it briefly and suggest a correction. If the sentence is correct, confirm it and optionally offer a small tip. Keep your response to 2-3 sentences. Reply in swedish.

${sentence}`;

  try {
    await navigator.clipboard.writeText(text);
    showToast('✓ Prompt + sentence copied!', 2500);
  } catch {
    // Fallback
    fallbackCopy(text, '✓ Prompt + sentence copied!');
  }
}

/* ─── Clipboard: copy only the sentence ─── */
async function copyOnlySentence() {
  const sentence = sentenceInput.value.trim();
  if (!sentence) {
    showToast('Please write a sentence first.', 2000);
    return;
  }

  try {
    await navigator.clipboard.writeText(sentence);
    // visual feedback on the button itself
    const original = copySentenceBtn.textContent;
    copySentenceBtn.textContent = '✓';
    setTimeout(() => {
      copySentenceBtn.textContent = original;
    }, 2000);
    showToast('✓ Sentence copied!', 1500);
  } catch {
    fallbackCopy(sentence, '✓ Sentence copied!');
  }
}

/* ─── Clipboard fallback ─── */
function fallbackCopy(text, successMsg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(successMsg, 2000);
  } catch {
    showToast('Could not copy. Please copy manually.', 2000);
  }
  document.body.removeChild(ta);
}

/* ─── Event listeners ─── */
newWordBtn.addEventListener('click', fetchNewWord);
checkBtn.addEventListener('click', copyCheckPrompt);
copySentenceBtn.addEventListener('click', copyOnlySentence);

/* ─── Init ─── */
async function init() {
  const loaded = await loadWordLists();
  if (loaded) {
    await fetchNewWord();
  }
}

init();