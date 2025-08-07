let editor;
let currentLang = 'html';
let currentTheme = 'dracula';

const modeMap = {
  html: 'htmlmixed',
  python: 'python',
  cpp: 'text/x-c++src',
};

const defaultCode = {
  html: `<!DOCTYPE html>
<html>
<head><style>body { font-family: sans-serif; }</style></head>
<body>
  <h1>Welcome to EDU_HUB</h1>
  <script>console.log("JS Ready")</script>
</body>
</html>`,
  python: `print("Hello from EDU_HUB Python")`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from EDU_HUB C++" << endl;
    return 0;
}`
};

function createEditor(lang) {
  if (editor) editor.toTextArea();

  const mode = modeMap[lang];
  const starter = defaultCode[lang];

  editor = CodeMirror(document.getElementById('editor'), {
    value: starter,
    mode: mode,
    theme: currentTheme,
    lineNumbers: true,
    lineWrapping: true,
    tabSize: 2,
  });

  document.getElementById('file-ext').textContent = lang === 'cpp' ? 'cpp' : lang;
}

function runCode() {
  const lang = document.getElementById('language').value;
  const code = editor.getValue();
  const output = document.getElementById('output');

  if (lang === 'html') {
    output.srcdoc = code;
  } else {
    output.srcdoc = `
      <html>
        <body style="padding:1rem; font-family:monospace;">
          <h3>Simulated Output for ${lang}</h3>
          <pre>${code}</pre>
          <p style="color:gray;">(Use a backend API to execute this)</p>
        </body>
      </html>`;
  }
}

document.getElementById('language').addEventListener('change', (e) => {
  currentLang = e.target.value;
  createEditor(currentLang);
});

document.getElementById('run').addEventListener('click', runCode);

document.getElementById('toggle-theme').addEventListener('click', () => {
  const body = document.body;
  const isDark = body.classList.contains('dark');
  body.classList.toggle('dark', !isDark);
  body.classList.toggle('light', isDark);
  currentTheme = isDark ? 'eclipse' : 'dracula';
  createEditor(currentLang);
});

// Initial setup
document.body.classList.add('dark');
createEditor(currentLang);