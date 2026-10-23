document.addEventListener('DOMContentLoaded', () => {
  const btnListen = document.getElementById('btnListen');
  const btnStop = document.getElementById('btnStop');
  const statusIndicator = document.getElementById('statusIndicator');
  const heardWords = document.getElementById('heardWords');
  const matchedCommand = document.getElementById('matchedCommand');
  const noteArea = document.getElementById('noteArea');
  const logContainer = document.getElementById('logContainer');

  const simCreate = document.getElementById('simCreate');
  const simRead = document.getElementById('simRead');
  const simSummarize = document.getElementById('simSummarize');
  const simClear = document.getElementById('simClear');

  const confirmModal = document.getElementById('confirmModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMsg = document.getElementById('modalMsg');
  const modalBtnCancel = document.getElementById('modalBtnCancel');
  const modalBtnConfirm = document.getElementById('modalBtnConfirm');
  const toast = document.getElementById('toast');

  let pendingAction = null;
  let isListening = false;

  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.background = isError ? '#991b1b' : '#065f46';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 2800);
  }

  function logActivity(tag, message) {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}] [${tag}]</span> <span>${escapeHtml(message)}</span>`;
    logContainer.prepend(entry);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Modal helpers
  function showConfirmation(title, message, callback) {
    modalTitle.textContent = title;
    modalMsg.textContent = message;
    pendingAction = callback;
    confirmModal.style.display = 'flex';
  }

  modalBtnCancel.addEventListener('click', () => {
    confirmModal.style.display = 'none';
    pendingAction = null;
    logActivity('Cancelled', 'Action cancelled by user.');
    showToast('Action cancelled.');
  });

  modalBtnConfirm.addEventListener('click', () => {
    confirmModal.style.display = 'none';
    if (typeof pendingAction === 'function') {
      pendingAction();
    }
    pendingAction = null;
  });

  // Web Speech API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    btnListen.addEventListener('click', () => {
      try {
        recognition.start();
        isListening = true;
        btnListen.disabled = true;
        btnStop.disabled = false;
        statusIndicator.className = 'status-badge status-recording';
        statusIndicator.textContent = 'Listening for commands...';
        logActivity('System', 'Microphone active. Listening for commands.');
        showToast('Listening for commands: "Create a note", "Read text", "Clear text", "Summarize text"');
      } catch (err) {
        showToast(`Could not start microphone: ${err.message}`, true);
      }
    });

    btnStop.addEventListener('click', () => {
      isListening = false;
      recognition.stop();
      btnListen.disabled = false;
      btnStop.disabled = true;
      statusIndicator.className = 'status-badge status-idle';
      statusIndicator.textContent = 'Ready';
      logActivity('System', 'Stopped listening.');
    });

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const spoken = event.results[last][0].transcript.trim();
      heardWords.textContent = `"${spoken}"`;
      logActivity('Spoken', `"${spoken}"`);
      processCommand(spoken);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        logActivity('Notice', `Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (isListening) {
        try { recognition.start(); } catch (e) {}
      } else {
        btnListen.disabled = false;
        btnStop.disabled = true;
        statusIndicator.className = 'status-badge status-idle';
        statusIndicator.textContent = 'Ready';
      }
    };
  } else {
    statusIndicator.textContent = 'Microphone API unavailable (Use simulation buttons)';
    btnListen.disabled = true;
  }

  // Simulation Fallback Buttons
  simCreate.addEventListener('click', () => {
    heardWords.textContent = '"Create a note"';
    processCommand('create a note');
  });

  simRead.addEventListener('click', () => {
    heardWords.textContent = '"Read text aloud"';
    processCommand('read text aloud');
  });

  simSummarize.addEventListener('click', () => {
    heardWords.textContent = '"Summarize text"';
    processCommand('summarize text');
  });

  simClear.addEventListener('click', () => {
    heardWords.textContent = '"Clear text"';
    processCommand('clear text');
  });

  // Command Evaluation Logic
  function processCommand(phrase) {
    const p = phrase.toLowerCase().replace(/[.,!?;:]/g, '').trim();

    // 1. "Create a note"
    if (p.includes('create a note') || p.includes('create note') || p.includes('new note') || p.includes('take a note')) {
      markMatched('Create a note');
      executeCreateNote();
    }
    // 2. "Read text aloud"
    else if (p.includes('read text') || p.includes('read note') || p.includes('speak text') || p.includes('read')) {
      markMatched('Read text aloud');
      executeReadText();
    }
    // 3. "Clear text"
    else if (p.includes('clear text') || p.includes('clear note') || p.includes('delete text') || p.includes('erase')) {
      markMatched('Clear text');
      executeClearText();
    }
    // 4. "Summarize text"
    else if (p.includes('summarize text') || p.includes('summarize note') || p.includes('summarize') || p.includes('summary')) {
      markMatched('Summarize text');
      executeSummarizeText();
    }
    else {
      matchedCommand.className = 'cmd-badge-none';
      matchedCommand.textContent = 'Command not recognized';
      logActivity('Unrecognized', `"${phrase}" did not match any predefined command.`);
      showToast(`Command "${phrase}" not recognized.`, true);
    }
  }

  function markMatched(name) {
    matchedCommand.className = 'cmd-badge-matched';
    matchedCommand.textContent = `Matched: "${name}"`;
    logActivity('Matched', `Command recognized: "${name}"`);
  }

  // 1. Create a note -> Asks confirmation if text already exists
  function executeCreateNote() {
    if (noteArea.value.trim().length > 0) {
      showConfirmation(
        'Overwrite Existing Note?',
        'You already have text in your notepad. Creating a new note will replace your current text. Do you want to proceed?',
        () => {
          noteArea.value = 'Meeting Notes - ' + new Date().toLocaleDateString() + '\n1. Review speech analysis features.\n2. Verify command recognition actions.\n3. Complete documentation.\n';
          logActivity('Executed', 'New note created after user confirmed overwrite.');
          showToast('New note created!');
        }
      );
    } else {
      noteArea.value = 'Meeting Notes - ' + new Date().toLocaleDateString() + '\n1. Review speech analysis features.\n2. Verify command recognition actions.\n3. Complete documentation.\n';
      logActivity('Executed', 'New note template created.');
      showToast('New note created!');
    }
  }

  // 2. Read text aloud -> Safe, speaks immediately via speech synthesis
  function executeReadText() {
    const text = noteArea.value.trim();
    if (!text) {
      showToast('Notepad is empty! Nothing to read.', true);
      logActivity('Warning', 'Cannot read: document is empty.');
      return;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
      logActivity('Executed', 'Reading document aloud.');
      showToast('Reading document aloud...');
    } else {
      showToast('Speech synthesis not supported in this browser.', true);
    }
  }

  // 3. Clear text -> Destructive, ALWAYS asks for confirmation!
  function executeClearText() {
    if (!noteArea.value.trim()) {
      showToast('Notepad is already empty.');
      return;
    }
    showConfirmation(
      'Confirm Document Deletion',
      '⚠️ Are you sure you want to permanently clear the current text? This action cannot be undone.',
      () => {
        noteArea.value = '';
        logActivity('Executed', 'Notepad cleared after confirmation.');
        showToast('Document cleared.');
      }
    );
  }

  // 4. Summarize text -> Safe, summarizes note
  function executeSummarizeText() {
    const text = noteArea.value.trim();
    if (!text) {
      showToast('Notepad is empty! Nothing to summarize.', true);
      return;
    }
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [];
    if (sentences.length <= 1) {
      showToast('Add more sentences to the note to produce a summary.', true);
      return;
    }
    const summary = sentences.slice(0, 2).map(s => s.trim()).join(' ');
    noteArea.value = noteArea.value + '\n\n--- SUMMARY ---\n' + summary;
    logActivity('Executed', 'Summary generated and appended to note.');
    showToast('Summary appended to note!');
  }
});
