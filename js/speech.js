// js/speech.js
// Verbesserte Stimmauswahl: Gruppierung, Testbutton, Rate + Volume, Persistenz
const STORAGE_KEYS = {
  ENABLED: 'tts_enabled',
  VOICE: 'tts_voice',
  RATE: 'tts_rate',
  VOLUME: 'tts_volume'
};

export function isTTSEnabled() {
  return localStorage.getItem(STORAGE_KEYS.ENABLED) === 'true';
}
export function setTTSEnabled(enabled) {
  localStorage.setItem(STORAGE_KEYS.ENABLED, enabled ? 'true' : 'false');
  const btn = document.getElementById('tts-toggle');
  if (btn) btn.setAttribute('aria-pressed', String(enabled));
}

export function getSavedVoiceName() {
  return localStorage.getItem(STORAGE_KEYS.VOICE) || '';
}
export function setSavedVoiceName(name) {
  if (name) localStorage.setItem(STORAGE_KEYS.VOICE, name);
  else localStorage.removeItem(STORAGE_KEYS.VOICE);
}

export function getSavedRate() {
  return parseFloat(localStorage.getItem(STORAGE_KEYS.RATE) || '0.95');
}
export function setSavedRate(rate) {
  localStorage.setItem(STORAGE_KEYS.RATE, String(rate));
}

export function getSavedVolume() {
  return parseFloat(localStorage.getItem(STORAGE_KEYS.VOLUME) || '1');
}
export function setSavedVolume(vol) {
  localStorage.setItem(STORAGE_KEYS.VOLUME, String(vol));
}

// UI initialisieren: populate voices, wire controls
export function initSpeechControls() {
  const toggle = document.getElementById('tts-toggle');
  const select = document.getElementById('voice-select');
  const testBtn = document.getElementById('voice-test-btn');
  const rateInput = document.getElementById('voice-rate');
  const volInput = document.getElementById('voice-volume');
  const status = document.getElementById('voice-status');

  if (!toggle || !select || !testBtn || !rateInput || !volInput || !status) {
    // Elemente nicht vorhanden — nichts zu tun
    return;
  }

  // reflektiere gespeicherte Einstellungen
  const enabled = isTTSEnabled();
  toggle.setAttribute('aria-pressed', String(enabled));
  rateInput.value = String(getSavedRate());
  volInput.value = String(getSavedVolume());

  // Event‑Handler
  toggle.addEventListener('click', () => {
    const curr = isTTSEnabled();
    setTTSEnabled(!curr);
    status.textContent = !curr ? 'TTS aktiviert' : 'TTS deaktiviert';
  });

  rateInput.addEventListener('input', () => {
    setSavedRate(rateInput.value);
    status.textContent = `Tempo: ${rateInput.value}`;
  });

  volInput.addEventListener('input', () => {
    setSavedVolume(volInput.value);
    status.textContent = `Lautstärke: ${volInput.value}`;
  });

  testBtn.addEventListener('click', () => {
    const selected = select.value;
    const sample = 'Hallo, dies ist ein kurzer Stimmtest.';
    speakSampleWithSettings(sample, selected, parseFloat(rateInput.value), parseFloat(volInput.value));
  });

  // Populate voices (handle async load)
  function populateVoices() {
    const voices = window.speechSynthesis.getVoices() || [];
    select.innerHTML = ''; // clear

    if (!voices.length) {
      select.disabled = true;
      testBtn.disabled = true;
      status.textContent = 'Keine TTS‑Stimmen gefunden (Browser/OS)';
      return;
    }

    select.disabled = false;
    testBtn.disabled = false;
    status.textContent = '';

    // Helper: normalize lang (lowercase)
    const byLang = voices.reduce((acc, v) => {
      const lang = (v.lang || 'unknown').toLowerCase();
      if (!acc[lang]) acc[lang] = [];
      acc[lang].push(v);
      return acc;
    }, {});

    // Build preferred order: German variants first
    const preferredLangs = ['de-de', 'de-at', 'de-ch'];
    const seen = new Set();

    // Add optgroups for preferred langs then the rest
    const makeOption = (voice) => {
      const opt = document.createElement('option');
      opt.value = voice.name;
      const provider = (voice.localService === false) ? 'Online' : 'Local';
      opt.textContent = `${voice.name} — ${voice.lang} ${provider ? ' ('+provider+')' : ''}`;
      return opt;
    };

    // add preferred groups
    preferredLangs.forEach(lang => {
      const list = byLang[lang];
      if (list && list.length) {
        const og = document.createElement('optgroup');
        og.label = `Deutsch (${lang})`;
        list.forEach(v => { og.appendChild(makeOption(v)); seen.add(v.name); });
        select.appendChild(og);
      }
    });

    // add other German-ish (start with de)
    Object.keys(byLang).sort().forEach(lang => {
      if (!lang.startsWith('de')) return;
      const list = byLang[lang];
      if (!list) return;
      // skip ones already added
      const remaining = list.filter(v => !seen.has(v.name));
      if (!remaining.length) return;
      const og = document.createElement('optgroup');
      og.label = `Deutsch (${lang})`;
      remaining.forEach(v => { og.appendChild(makeOption(v)); seen.add(v.name); });
      select.appendChild(og);
    });

    // add remaining languages
    Object.keys(byLang).sort().forEach(lang => {
      if (lang.startsWith('de')) return;
      const list = byLang[lang];
      const og = document.createElement('optgroup');
      og.label = lang.toUpperCase();
      list.forEach(v => {
        if (seen.has(v.name)) return;
        og.appendChild(makeOption(v));
        seen.add(v.name);
      });
      if (og.children.length) select.appendChild(og);
    });

    // restore saved voice if present
    const saved = getSavedVoiceName();
    if (saved) {
      const match = Array.from(select.options).find(o => o.value === saved);
      if (match) select.value = saved;
    } else {
      // try to auto-select a German voice if exists
      const auto = Array.from(select.options).find(o => o.text.toLowerCase().includes('de') || o.text.toLowerCase().includes('german'));
      if (auto) select.value = auto.value;
    }

    // on change, save selection
    select.addEventListener('change', () => {
      setSavedVoiceName(select.value);
      status.textContent = `Stimme gesetzt: ${select.options[select.selectedIndex]?.text || ''}`;
    });
  }

  // Some browsers populate voices asynchronously
  const voicesNow = window.speechSynthesis.getVoices();
  if (voicesNow.length) populateVoices();
  else window.speechSynthesis.onvoiceschanged = populateVoices;
}

// Helper to speak a sample with chosen voice/rate/volume
export function speakSampleWithSettings(text, voiceName, rate = 0.95, volume = 1) {
  if (!('speechSynthesis' in window)) return;
  if (!isTTSEnabled()) {
    // optional: enable TTS automatically on first test
    setTTSEnabled(true);
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.volume = volume;
  utterance.pitch = 1.0;
  utterance.lang = 'de-DE';

  const voices = window.speechSynthesis.getVoices() || [];
  if (voiceName) {
    const v = voices.find(x => x.name === voiceName);
    if (v) utterance.voice = v;
  } else {
    // prefer German voice
    const v = voices.find(x => x.lang && x.lang.toLowerCase().startsWith('de'));
    if (v) utterance.voice = v;
  }

  try {
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (e) {
    console.warn('TTS speak error', e);
    return false;
  }
}

// Use in app when announcing guest: respects saved voice/rate/volume
export function speakGreeting(name, table, seat) {
  if (!('speechSynthesis' in window)) return;
  if (!isTTSEnabled()) return;

  const savedVoice = getSavedVoiceName();
  const rate = getSavedRate();
  const vol = getSavedVolume();

  const displayTable = table === 'Braut-Tisch' || table === 'tisch-1-2' ? 'dem Braut-Tisch' : `${table}`;
  const text = `Hallo ${name}! Dein Platz ist an ${displayTable}, Sitzplatz ${seat}. Wir freuen uns sehr, dass du da bist!`;

  // Cancel previous utterances
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  utterance.rate = rate || 0.95;
  utterance.volume = vol || 1;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices() || [];
  if (savedVoice) {
    const v = voices.find(x => x.name === savedVoice);
    if (v) utterance.voice = v;
  } else {
    // fallback: any de voice
    const v = voices.find(x => x.lang && x.lang.toLowerCase().startsWith('de'));
    if (v) utterance.voice = v;
  }

  // speak with safe try/catch
  try {
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('TTS Error', e);
  }
}
