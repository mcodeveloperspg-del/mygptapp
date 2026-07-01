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
    isRecording = false;
    recordButton.textContent = 'Start recording';
    recordingStatus.textContent = 'Recording stopped. You can generate your tasks now.';
  });
}

recordButton.addEventListener('click', () => {
  if (!recognition) return;

  if (isRecording) {
    recognition.stop();
    return;
  }

  recognition.start();
  isRecording = true;
  recordButton.textContent = 'Stop recording';
  recordingStatus.textContent = 'Listening... speak through your tasks for today.';
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
