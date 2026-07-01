const noteInput = document.querySelector('#noteInput');
const recordButton = document.querySelector('#recordButton');
const clearButton = document.querySelector('#clearButton');
const generateButton = document.querySelector('#generateButton');
const recordingStatus = document.querySelector('#recordingStatus');
const taskList = document.querySelector('#taskList');
const emptyState = document.querySelector('#emptyState');
const taskTemplate = document.querySelector('#taskTemplate');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isRecording = false;
let microphoneStream;

const prioritySignals = [
  { words: ['urgent', 'asap', 'immediately', 'critical', 'deadline'], score: 5 },
  { words: ['today', 'morning', 'noon', 'tonight', 'before', 'by '], score: 4 },
  { words: ['finish', 'submit', 'send', 'pay', 'call', 'schedule'], score: 3 },
  { words: ['buy', 'pick up', 'clean', 'review', 'email'], score: 2 },
];

if (!SpeechRecognition) {
  recordButton.disabled = true;
  recordingStatus.textContent = 'Speech recognition is not available in this browser. You can still type your note.';
} else {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.addEventListener('result', (event) => {
    const transcript = Array.from(event.results)
      .slice(event.resultIndex)
      .map((result) => result[0].transcript)
      .join(' ');

    noteInput.value = `${noteInput.value.trim()} ${transcript}`.trim();
  });

  recognition.addEventListener('end', () => {
    stopMicrophonePreview();
    isRecording = false;
    recordButton.textContent = 'Start recording';
    recordingStatus.textContent = 'Recording stopped. You can generate your tasks now.';
  });

  recognition.addEventListener('error', (event) => {
    stopMicrophonePreview();
    isRecording = false;
    recordButton.textContent = 'Start recording';
    recordingStatus.textContent = getRecognitionErrorMessage(event.error);
  });
}


recordButton.addEventListener('click', async () => {
  if (!recognition) return;

  if (isRecording) {
    recognition.stop();
    return;
  }

  recordButton.disabled = true;
  recordingStatus.textContent = 'Requesting microphone permission...';

  const hasMicrophoneAccess = await requestMicrophoneAccess();
  recordButton.disabled = false;

  if (!hasMicrophoneAccess) return;

  try {
    recognition.start();
    isRecording = true;
    recordButton.textContent = 'Stop recording';
    recordingStatus.textContent = 'Listening... speak through your tasks for today.';
  } catch (error) {
    stopMicrophonePreview();
    recordingStatus.textContent = 'Recording could not start. Try again after allowing microphone access.';
  }
});

clearButton.addEventListener('click', () => {
  noteInput.value = '';
  renderTasks([]);
  recordingStatus.textContent = 'Note cleared. Ready for a fresh recording.';
});

generateButton.addEventListener('click', () => {
  const tasks = createPrioritizedTasks(noteInput.value);
  renderTasks(tasks);
});

async function requestMicrophoneAccess() {
  if (!navigator.mediaDevices?.getUserMedia) {
    recordingStatus.textContent = 'Your browser cannot request microphone access here. Try Chrome or Edge on localhost or HTTPS.';
    return false;
  }

  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (error) {
    recordingStatus.textContent = 'Microphone access was blocked. Allow microphone permission in your browser and try again.';
    return false;
  }
}

function stopMicrophonePreview() {
  microphoneStream?.getTracks().forEach((track) => track.stop());
  microphoneStream = undefined;
}

function getRecognitionErrorMessage(error) {
  if (error === 'not-allowed' || error === 'service-not-allowed') {
    return 'Microphone access was blocked. Allow microphone permission in your browser and try again.';
  }

  if (error === 'no-speech') {
    return 'No speech was detected. Try recording again and speak clearly.';
  }

  if (error === 'network') {
    return 'Speech recognition needs a network connection in this browser. Check your connection and try again.';
  }

  return 'Recording stopped because speech recognition ran into an issue. Please try again.';
}

function createPrioritizedTasks(note) {
  return splitIntoTasks(note)
    .map((task) => ({ text: task, score: scoreTask(task) }))
    .sort((a, b) => b.score - a.score || a.text.localeCompare(b.text))
    .map((task, index) => ({ ...task, rank: index + 1, label: getPriorityLabel(index) }));
}

function splitIntoTasks(note) {
  return note
    .split(/\n|\.|;|,|\band\b|\bthen\b/gi)
    .map((task) => task.trim())
    .filter((task) => task.length > 2);
}

function scoreTask(task) {
  const normalized = task.toLowerCase();
  const signalScore = prioritySignals.reduce((total, signal) => {
    return signal.words.some((word) => normalized.includes(word)) ? total + signal.score : total;
  }, 0);

  return signalScore + Math.min(Math.ceil(task.length / 40), 3);
}

function getPriorityLabel(index) {
  if (index === 0) return 'High';
  if (index <= 2) return 'Medium';
  return 'Low';
}

function renderTasks(tasks) {
  taskList.innerHTML = '';
  emptyState.hidden = tasks.length > 0;

  tasks.forEach((task) => {
    const taskCard = taskTemplate.content.cloneNode(true);
    taskCard.querySelector('.priority-badge').textContent = `${task.rank}. ${task.label}`;
    taskCard.querySelector('h3').textContent = task.text;
    taskCard.querySelector('p').textContent = `Priority score: ${task.score}`;
    taskList.appendChild(taskCard);
  });
}
