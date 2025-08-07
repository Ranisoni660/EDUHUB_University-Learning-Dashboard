let model;
const classNames = ["FORMAL MENS", "FORMAL FEMALES", "CIVIL ATTIRE", "INFORMAL"];
let currentFile = null;

const feedback = {
  "FORMAL MENS": {
    tech: { formality: 9, color: 8, suitability: 9, tip: "Great choice for technical interviews! Pair with a light shirt and dark trousers." },
    civil: { formality: 7, color: 6, suitability: 6, tip: "Good, but opt for simpler suits for civil services interviews." },
    noncivil: { formality: 9, color: 8, suitability: 9, tip: "Perfect for roles like data analyst or air hostess. Ensure a tailored fit." }
  },
  "FORMAL FEMALES": {
    tech: { formality: 9, color: 8, suitability: 8, tip: "Ideal for technical interviews. Avoid loud prints for a professional look." },
    civil: { formality: 6, color: 7, suitability: 5, tip: "Consider traditional attire like sarees or kurtas for civil services." },
    noncivil: { formality: 9, color: 8, suitability: 9, tip: "Excellent for roles like air hostess or data analyst. Try a blazer or dress." }
  },
  "CIVIL ATTIRE": {
    tech: { formality: 3, color: 5, suitability: 2, tip: "Not suitable for technical interviews. Opt for formal western attire." },
    civil: { formality: 9, color: 8, suitability: 9, tip: "Perfect for civil services! Use light-colored sarees or simple kurtas." },
    noncivil: { formality: 4, color: 6, suitability: 3, tip: "Not ideal for roles like air hostess or data analyst. Choose formal attire." }
  },
  "INFORMAL": {
    tech: { formality: 2, color: 3, suitability: 2, tip: "Informal attire like t-shirts or jeans is not suitable for technical interviews. Choose a formal suit or collared shirt." },
    civil: { formality: 1, color: 2, suitability: 1, tip: "Informal attire is inappropriate for civil services. Prefer sarees or kurtas." },
    noncivil: { formality: 2, color: 3, suitability: 2, tip: "Informal attire is not suitable for professional roles like air hostess. Opt for a blazer or formal dress." }
  }
};

async function loadModel() {
  console.log('Checking for TensorFlow.js:', window.tf);
  if (!window.tf) {
    console.error('TensorFlow.js not loaded.');
    document.getElementById('tip').innerText = 'Error: TensorFlow.js not loaded. Check index.html script tag.';
    return;
  }

  try {
    const modelUrl = './model/model.json';
    const response = await fetch(modelUrl, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    model = await tf.loadLayersModel(modelUrl);
    console.log('✅ Model loaded successfully.');
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
      analyzeBtn.disabled = true; // Disabled until image is uploaded
    } else {
      console.error('Analyze button not found in DOM.');
    }
  } catch (error) {
    console.error('Error loading model:', error);
    let tipMessage = 'Error loading model. ';
    if (error.message.includes('404')) {
      tipMessage += 'Model files not found in ./model/. Ensure model.json, group1-shard1of1.bin, and metadata.json are present.';
    } else {
      tipMessage += 'Failed to load model. Check file paths and Live Server setup.';
    }
    document.getElementById('tip').innerText = tipMessage;
  }
}

function resetForm() {
  const placeholder = document.getElementById('image-placeholder');
  const preview = document.getElementById('preview');
  const video = document.getElementById('video');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const fileInput = document.getElementById('file-input');
  const fileName = document.getElementById('file-name');

  // Reset UI elements
  placeholder.style.display = 'flex';
  preview.style.display = 'none';
  preview.src = '';
  video.style.display = 'none';
  fileInput.value = '';
  fileName.textContent = '';
  analyzeBtn.innerText = 'Analyze';
  analyzeBtn.disabled = true;

  // Reset feedback
  const updateText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
  };
  updateText('overall', 'N/A');
  updateText('formality', 'N/A');
  updateText('color', 'N/A');
  updateText('suitability', 'N/A');
  updateText('tip', 'Upload an image to get started!');

  // Clear current file
  currentFile = null;
}

async function predictImage(event) {
  const img = document.getElementById('preview');
  const file = event.target.files?.[0];
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (!file) {
    console.error('No file selected.');
    document.getElementById('tip').innerText = 'Please select an image to analyze.';
    return;
  }

  currentFile = file; // Store file for analyzeBtn
  img.src = URL.createObjectURL(file);
  img.style.display = 'block';

  img.onload = async () => {
    try {
      if (!model) {
        throw new Error('Model not loaded.');
      }

      const tensor = tf.browser.fromPixels(img)
        .resizeBilinear([224, 224])
        .toFloat()
        .div(tf.scalar(255))
        .expandDims();

      const prediction = await model.predict(tensor);
      const scores = prediction.dataSync();
      const classId = prediction.argMax(1).dataSync()[0];
      const label = classNames[classId];

      console.log('Prediction scores:', Array.from(scores).map((score, i) => `${classNames[i]}: ${score.toFixed(4)}`));
      console.log('Predicted class:', label);

      // Use 'tech' as default role for feedback
      let final = feedback[label].tech;

      // Handle FORMAL FEMALES mismatch assuming male context for technical interviews
      if (label === 'FORMAL FEMALES') {
        final.tip = "This outfit is good for women’s formal attire. Consider a suit or collared shirt for men’s technical interviews.";
      }

      const updateText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
      };

      updateText('formality', final?.formality ?? '-');
      updateText('color', final?.color ?? '-');
      updateText('suitability', final?.suitability ?? '-');
      updateText('tip', final?.tip ?? 'No specific tip found.');

      // Calculate overall score
      const overall = Math.round((final.formality + final.color + final.suitability) / 3);
      updateText('overall', `${overall}/10`);

      // Change button text to "Try Again"
      if (analyzeBtn) {
        analyzeBtn.innerText = 'Try Again';
      }

      tensor.dispose();
      prediction.dispose();
    } catch (error) {
      console.error('Error predicting image:', error);
      document.getElementById('tip').innerText = 'Error processing image. Use a clear, full-body image.';
    }
  };
}