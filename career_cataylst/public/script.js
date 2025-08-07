class CareerCatalyst {
    constructor() {
        this.currentStep = 'get-started';
        this.selectedOptions = {};
        this.currentQuestionIndex = 0;
        this.questions = []; // Set dynamically via API or fallback

        this.replaysLeft = 2;
        this.recordingAttemptsLeft = 2;
        this.isRecording = false;
        this.recordingStartTime = null;
        this.timerInterval = null;
        this.spokenTimeInterval = null;
        this.totalSpokenTime = 0;
        this.currentRecordingTime = 0;
        this.hasValidRecording = false;
        this.minRecordingTime = 30; // ABS_MIN
        this.maxRecordingTime = 180; // ABS_MAX
        this.minIdealTime = 45; // MIN_IDEAL
        this.maxIdealTime = 75; // MAX_IDEAL
        this.uploadedAudioFile = null;
        this.audioFiles = ['q1_strong_1min.mp3', 'q2_strong_2min.mp3'];
        this.feedback = [];
        this.KEYWORD_BUCKETS = {
            "Projects": ["project", "resume analyzer", "disaster monitoring", "interview simulator", "ai-dms"],
            "Skills/Stack": ["python", "react", "tailwind", "flask", "nlp", "transformer", "bert", "spacy", "pandas", "full-stack", "javascript", "sql", "docker"],
            "Impact/Outcome": ["real-world", "production", "scale", "impact", "value", "deployed", "scalable"],
            "Experience": ["internship", "infosys", "team", "hackathon", "collaborat", "mentor"],
            "Goal/Intent": ["looking for", "apply", "role", "contribute", "grow", "from day one"],
            "Coding": ["algorithm", "data structure", "code", "implement", "function", "class", "method", "optimize"]
        };
        this.STRUCTURE_HINTS = {
            "intro": ["hi", "hello", "i'm", "i am", "my name"],
            "experience": ["project", "built", "developed", "worked on", "led"],
            "skills": ["python", "react", "tailwind", "nlp", "machine learning", "ai", "full-stack", "backend", "javascript", "sql", "docker"],
            "goal": ["looking for", "apply", "role", "contribute", "grow"],
            "logic": ["approach", "logic", "reasoning", "solution", "steps"]
        };
        this.FILLERS = ["um", "uh", "like", "you know", "sort of", "kind of", "basically", "actually"];
        this.WEIGHTS = {
            "length": 0.20,
            "keywords": 0.35,
            "structure": 0.25,
            "clarity": 0.20
        };

        this.initializeElements();
        this.initializeEventListeners();
        this.showStep('get-started');
        this.checkAllRequirements();
        this.createFloatingDots();
        console.log('Career Catalyst initialized successfully');
    }

    initializeElements() {
        // Step containers
        this.steps = {
            'get-started': document.getElementById('get-started-page'),
            'interview-type': document.getElementById('step-interview-type'),
            'hr-type': document.getElementById('step-hr-type'),
            'domain': document.getElementById('step-domain'),
            'duration': document.getElementById('step-duration'),
            'interview': document.getElementById('interview-phase'),
            'thank-you': document.getElementById('thank-you-phase')
        };

        // Get started elements
        this.checkboxes = {
            voice: document.getElementById('voice-check'),
            ai: document.getElementById('ai-check'),
            fullscreen: document.getElementById('fullscreen-check'),
            minimize: document.getElementById('minimize-check')
        };
        this.startInput = document.getElementById('start-input');

        // Form elements
        this.durationInput = document.getElementById('duration');
        this.startButton = document.getElementById('start-interview');

        // Interview elements
        this.questionNumber = document.getElementById('question-number');
        this.currentQuestion = document.getElementById('current-question');
        this.replayButton = document.getElementById('replay-question');
        this.replayCount = document.getElementById('replay-count');
        this.recordButton = document.getElementById('record-answer');
        this.stopButton = document.getElementById('stop-recording');
        this.submitButton = document.getElementById('submit-answer');
        this.recordCount = document.getElementById('record-count');
        this.recordingIndicator = document.getElementById('recording-indicator');
        this.timerDisplay = document.getElementById('timer-display');
        this.speakingTime = document.getElementById('speaking-time');
        this.spokenTime = document.getElementById('spoken-time');
        this.uploadButton = document.getElementById('upload-answer');
        this.audioUploadInput = document.getElementById('audio-upload');

        // Status
        this.statusMessages = document.getElementById('status-messages');
    }

    initializeEventListeners() {
        // Checkbox change events
        Object.values(this.checkboxes).forEach(checkbox => {
            checkbox.addEventListener('change', () => this.checkAllRequirements());
        });

        // Start input validation
        this.startInput.addEventListener('input', () => this.validateStartInput());
        this.startInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.startInput.value.toLowerCase() === 'start') {
                this.proceedToInterview();
            }
        });

        // Option card selections
        document.addEventListener('click', (e) => {
            if (e.target.closest('.option-card-3d')) {
                this.handleOptionSelection(e.target.closest('.option-card-3d'));
            }
        });

        // Buttons
        this.startButton.addEventListener('click', () => this.startInterview());
        this.replayButton.addEventListener('click', () => this.replayQuestion());
        this.recordButton.addEventListener('click', () => this.startRecording());
        this.stopButton.addEventListener('click', () => this.stopRecording());
        this.submitButton.addEventListener('click', () => this.submitAnswer());
        if (this.uploadButton) {
            this.uploadButton.addEventListener('click', () => this.audioUploadInput.click());
            this.audioUploadInput.addEventListener('change', (e) => this.handleAudioUpload(e));
        }

        // Duration validation
        this.durationInput.addEventListener('input', () => this.validateDuration());

        // Thank you button
        document.getElementById('get-feedback').addEventListener('click', () => {
            this.showFeedback();
        });
    }

    checkAllRequirements() {
        const allChecked = Object.values(this.checkboxes).every(checkbox => checkbox.checked);
        this.startInput.disabled = !allChecked;

        if (allChecked) {
            this.startInput.style.opacity = '1';
            this.startInput.placeholder = 'Type "start" to continue';
        } else {
            this.startInput.style.opacity = '0.5';
            this.startInput.placeholder = 'Complete all checkboxes first';
        }
    }

    validateStartInput() {
        const value = this.startInput.value.toLowerCase();
        if (value === 'start') {
            this.startInput.style.borderColor = '#22c55e';
            this.startInput.style.boxShadow = '0 0 25px rgba(34, 197, 94, 0.4)';
        } else {
            this.startInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            this.startInput.style.boxShadow = 'none';
        }
    }

    proceedToInterview() {
        if (this.startInput.value.toLowerCase() === 'start') {
            this.showMessage('🚀 Great! Let\'s begin your interview setup.', 'success');
            setTimeout(() => this.showStep('step-interview-type'), 1000);
        }
    }

    handleOptionSelection(card) {
        const container = card.parentElement;
        const value = card.dataset.value;

        // Remove previous selections
        container.querySelectorAll('.option-card-3d').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        // Store selection and advance
        if (this.currentStep === 'interview-type') {
            this.selectedOptions.interviewType = value;
            if (value === 'hr') {
                setTimeout(() => this.showStep('step-hr-type'), 500);
            } else {
                setTimeout(() => this.showStep('step-domain'), 500);
            }
        } else if (this.currentStep === 'hr-type') {
            this.selectedOptions.hrType = value;
            setTimeout(() => this.showStep('step-domain'), 500);
        } else if (this.currentStep === 'domain') {
            this.selectedOptions.domain = value;
            setTimeout(() => this.showStep('step-duration'), 500);
        }
    }

    showStep(stepName) {
        // Hide all steps first
        Object.values(this.steps).forEach(step => {
            if (step) step.classList.add('hidden');
        });

        // Show the target step
        let targetStep = stepName;
        if (stepName.startsWith('step-')) {
            targetStep = stepName.replace('step-', '');
        }

        if (this.steps[targetStep]) {
            this.steps[targetStep].classList.remove('hidden');
            this.currentStep = targetStep;
            console.log('Showing step:', targetStep);
        } else {
            console.error('Step not found:', targetStep);
        }
    }

    validateDuration() {
        const value = parseInt(this.durationInput.value);
        if (value > 15) {
            this.durationInput.value = 15;
            this.showMessage('⚠️ Duration cannot exceed 15 minutes.', 'warning');
        } else if (value < 1) {
            this.durationInput.value = 1;
        }
    }

    async startInterview() {
        const duration = this.durationInput.value;

        if (!this.selectedOptions.interviewType || !this.selectedOptions.domain || !duration) {
            this.showMessage('⚠️ Please complete all selections before starting.', 'warning');
            return;
        }

        this.questions = await this.getQuestions(); // Fetch questions dynamically
        this.selectedOptions.duration = duration;
        this.showStep('interview');
        this.loadCurrentQuestion();
        this.showMessage('🎤 Interview started! Listen carefully to the question.', 'success');
        setTimeout(() => this.speakQuestion(), 1000);
    }

    loadCurrentQuestion() {
        this.currentQuestion.textContent = this.questions[this.currentQuestionIndex];
        this.questionNumber.textContent = this.currentQuestionIndex + 1;

        // Reset question-specific counters
        this.replaysLeft = 2;
        this.recordingAttemptsLeft = 2;
        this.hasValidRecording = false;
        this.currentRecordingTime = 0;
        this.uploadedAudioFile = null;
        if (this.uploadButton) this.uploadButton.disabled = false;
        this.updateReplayCount();
        this.updateRecordCount();

        // Reset buttons visibility and state
        this.replayButton.disabled = false;
        this.recordButton.disabled = false;
        this.recordButton.classList.remove('hidden');
        this.stopButton.classList.add('hidden');
        this.submitButton.classList.add('hidden');
        this.recordingIndicator.classList.add('hidden');
        
        // Reset button content
        this.recordButton.innerHTML = '<i class="fas fa-microphone"></i><span>Record Answer</span><span id="record-count">(2 attempts left)</span><div class="btn-glow"></div>';
        this.replayButton.innerHTML = '<i class="fas fa-volume-up"></i><span>Replay Question</span><span id="replay-count">(2 left)</span><div class="btn-glow"></div>';
    }

    speakQuestion() {
        // Cancel any existing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(this.questions[this.currentQuestionIndex]);

        // Set male voice properties
        utterance.rate = 0.9;
        utterance.pitch = 0.7; // Lower pitch for more masculine sound
        utterance.volume = 1;

        // Wait for voices to load and find male voice
        const voices = speechSynthesis.getVoices();
        console.log('Available voices:', voices.map(v => `${v.name} - ${v.lang} - ${v.gender || 'unknown'}`));
        
        // Better male voice detection
        const maleVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('male') ||
            voice.name.toLowerCase().includes('david') ||
            voice.name.toLowerCase().includes('mark') ||
            voice.name.toLowerCase().includes('guy') ||
            voice.name.toLowerCase().includes('matthew') ||
            voice.name.toLowerCase().includes('daniel') ||
            voice.name.toLowerCase().includes('thomas') ||
            (voice.lang.includes('en-US') && voice.name.toLowerCase().includes('google us english'))
        );

        if (maleVoice) {
            utterance.voice = maleVoice;
            console.log('Using male voice:', maleVoice.name);
        } else {
            // Fallback: use first available voice and adjust pitch
            if (voices.length > 0) {
                utterance.voice = voices[0];
                utterance.pitch = 0.6; // Even lower pitch as fallback
            }
            console.log('Using fallback voice with low pitch');
        }

        utterance.onstart = () => {
            this.showMessage('🔊 Playing question audio...', 'info');
        };

        utterance.onend = () => {
            this.showMessage('✅ Question audio complete. You may now record your answer.', 'success');
        };

        speechSynthesis.speak(utterance);
    }

    replayQuestion() {
        if (this.replaysLeft > 0) {
            this.replaysLeft--;
            this.updateReplayCount();
            this.speakQuestion();

            if (this.replaysLeft === 0) {
                this.replayButton.disabled = true;
                this.replayButton.innerHTML = '<i class="fas fa-volume-up"></i><span>🔁 No replays left</span><div class="btn-glow"></div>';
            }
        }
    }

    updateReplayCount() {
        this.replayCount.textContent = `(${this.replaysLeft} left)`;
    }

    updateRecordCount() {
        this.recordCount.textContent = `(${this.recordingAttemptsLeft} attempts left)`;
    }

    startRecording() {
        if (this.recordingAttemptsLeft > 0 && !this.isRecording) {
            this.isRecording = true;
            this.recordingAttemptsLeft--;
            this.updateRecordCount();

            // Show recording UI
            this.recordButton.classList.add('hidden');
            this.stopButton.classList.remove('hidden');
            this.recordingIndicator.classList.remove('hidden');

            // Start timers
            this.recordingStartTime = Date.now();
            this.timerInterval = setInterval(() => this.updateRecordingTimer(), 100);
            this.spokenTimeInterval = setInterval(() => this.updateSpokenTime(), 100);

            this.showMessage('🔴 Recording started. Speak clearly and confidently!', 'info');
            this.simulateRecording();
        }
    }

    stopRecording() {
        if (this.isRecording) {
            this.isRecording = false;
            clearInterval(this.timerInterval);
            clearInterval(this.spokenTimeInterval);

            // Calculate recording duration
            this.currentRecordingTime = (Date.now() - this.recordingStartTime) / 1000;
            this.totalSpokenTime += this.currentRecordingTime;

            // Hide recording UI
            this.stopButton.classList.add('hidden');
            this.recordingIndicator.classList.add('hidden');

            // Validate recording length
            const { bucket } = this.durationBucketAndScore(this.currentRecordingTime);
            if (bucket === "Too Short" || bucket === "Too Long") {
                this.showMessage(`❌ Recording ${bucket.toLowerCase()} (${Math.floor(this.currentRecordingTime)}s).`, 'error');
                this.hasValidRecording = false;
            } else {
                this.showMessage('✅ Recording saved successfully!', 'success');
                this.hasValidRecording = true;
                this.submitButton.classList.remove('hidden');
            }

            if (this.recordingAttemptsLeft > 0 && !this.hasValidRecording) {
                this.recordButton.classList.remove('hidden');
                this.showMessage('⚠️ You have one more attempt left if needed.', 'warning');
            } else if (this.recordingAttemptsLeft === 0 && !this.hasValidRecording) {
                this.recordButton.disabled = true;
                this.uploadButton.disabled = true;
                this.recordButton.innerHTML = '<i class="fas fa-microphone"></i><span>No attempts left</span><div class="btn-glow"></div>';
                this.showMessage('❌ No more recording attempts available. Moving to next question.', 'error');
                setTimeout(() => this.advanceToNextQuestion(), 3000);
            } else if (!this.hasValidRecording) {
                this.recordButton.classList.remove('hidden');
            }
        }
    }

    handleAudioUpload(event) {
        if (this.recordingAttemptsLeft > 0) {
            const file = event.target.files[0];
            if (!file) {
                this.showMessage('⚠️ No file selected.', 'warning');
                return;
            }
            if (!file.type.startsWith('audio/')) {
                this.showMessage('⚠️ Please upload an audio file (.mp3 or .wav).', 'warning');
                return;
            }
            this.recordingAttemptsLeft--;
            this.updateRecordCount();
            this.uploadedAudioFile = file.name;
            this.currentRecordingTime = this.getMockDuration(file.name);
            this.hasValidRecording = true;
            this.submitButton.classList.remove('hidden');
            this.showMessage('✅ Audio file uploaded successfully!', 'success');
            if (this.recordingAttemptsLeft === 0) {
                this.recordButton.disabled = true;
                this.uploadButton.disabled = true;
                this.recordButton.innerHTML = '<i class="fas fa-microphone"></i><span>No attempts left</span><div class="btn-glow"></div>';
            }
        } else {
            this.showMessage('❌ No more attempts available.', 'error');
        }
    }

    async submitAnswer() {
        if (this.hasValidRecording) {
            await this.generateFeedback();
            this.showMessage('✅ Answer submitted successfully!', 'success');
            setTimeout(() => this.advanceToNextQuestion(), 1500);
        }
    }

    advanceToNextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.loadCurrentQuestion();
            this.showMessage(`Moving to question ${this.currentQuestionIndex + 1}...`, 'info');
            setTimeout(() => this.speakQuestion(), 2000);
        } else {
            this.completeInterview();
        }
    }

    completeInterview() {
        this.showStep('thank-you');
        this.showMessage('🎉 Interview completed successfully! Well done!', 'success');
    }

    updateRecordingTimer() {
        if (this.recordingStartTime) {
            const elapsed = (Date.now() - this.recordingStartTime) / 1000;
            const minutes = Math.floor(elapsed / 60);
            const seconds = Math.floor(elapsed % 60);
            this.timerDisplay.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    updateSpokenTime() {
        const currentTotal = this.totalSpokenTime + (this.isRecording ? (Date.now() - this.recordingStartTime) / 1000 : 0);
        const minutes = Math.floor(currentTotal / 60);
        const seconds = Math.floor(currentTotal % 60);
        this.spokenTime.textContent = 
            `${minutes.toString().padStart(1, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    simulateRecording() {
        try {
            console.log('Recording audio...');
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    console.log('Microphone access granted');
                    // In a real implementation, MediaRecorder would be used here
                })
                .catch(error => {
                    console.log('Microphone simulation mode');
                });
        } catch (error) {
            console.log('MediaRecorder simulation active');
        }
    }

    durationBucketAndScore(secs) {
        if (!secs) return { bucket: "Missing", score: 0.0 };
        if (secs < this.minRecordingTime) return { bucket: "Too Short", score: 0.2 };
        if (secs > this.maxRecordingTime) return { bucket: "Too Long", score: 0.2 };
        if (this.minIdealTime <= secs && secs <= this.maxIdealTime) {
            return { bucket: "Ideal", score: 1.0 };
        }
        if (secs < this.minIdealTime) {
            const gap = this.minIdealTime - secs;
            return { bucket: "Slightly Short", score: Math.max(0.4, 1.0 - (gap / 30.0)) };
        }
        const gap = secs - this.maxIdealTime;
        return { bucket: "Slightly Long", score: Math.max(0.4, 1.0 - (gap / 45.0)) };
    }

    keywordScore(text) {
        const t = text.toLowerCase().replace(/\s+/g, ' ').trim();
        let hits = 0;
        const details = {};
        for (const [bucket, kws] of Object.entries(this.KEYWORD_BUCKETS)) {
            const found = kws.filter(kw => t.includes(kw));
            details[bucket] = found;
            if (found.length) hits++;
        }
        const total = Object.keys(this.KEYWORD_BUCKETS).length;
        return { score: Math.round((hits / total) * 100) / 100, details };
    }

    structureScore(text) {
        const t = text.toLowerCase().replace(/\s+/g, ' ').trim();
        const anyIn = (keys) => keys.some(k => t.includes(k));
        const parts = {
            "intro": anyIn(this.STRUCTURE_HINTS["intro"]),
            "experience": anyIn(this.STRUCTURE_HINTS["experience"]),
            "skills": anyIn(this.STRUCTURE_HINTS["skills"]),
            "goal": anyIn(this.STRUCTURE_HINTS["goal"]),
            "logic": anyIn(this.STRUCTURE_HINTS["logic"])
        };
        return { score: Math.round((Object.values(parts).filter(v => v).length / 5.0) * 100) / 100, parts };
    }

    clarityScore(text) {
        const t = text.toLowerCase().replace(/\s+/g, ' ').trim();
        const words = t.split(' ');
        const n = Math.max(1, words.length);
        const fillerCount = this.FILLERS.reduce((count, f) => count + (t.match(new RegExp(`\\b${f}\\b`, 'g')) || []).length, 0);
        const density = fillerCount / n;
        const score = Math.max(0.3, 1.0 - 8 * density);
        return { score: Math.round(score * 100) / 100, info: { fillerCount, fillerDensity: Math.round(density * 10000) / 10000 } };
    }

    async getQuestions() {
        const { interviewType, hrType, domain } = this.selectedOptions;
        if (interviewType === 'hr') {
            const hrQuestions = {
                general: [
                    "Tell me about yourself and your background.",
                    "What are your greatest strengths and how do they relate to this position?",
                    "Why do you want to work with our company?"
                ],
                freshers: [
                    "Describe your academic journey and key projects.",
                    "How have you prepared for this role as a fresher?",
                    "What challenges did you face in your projects and how did you overcome them?"
                ],
                behavioral: [
                    "Give an example of a time you worked in a team to achieve a goal.",
                    "Describe a situation where you faced a conflict and how you resolved it.",
                    "Tell me about a time you demonstrated leadership."
                ]
            };
            return hrType ? hrQuestions[hrType] || hrQuestions.general : hrQuestions.general;
        } else if (interviewType === 'technical') {
            try {
                const response = await axios.post('/generate-questions', {
                    domain: domain || 'web-development',
                    interviewType
                });
                return response.data.questions;
            } catch (error) {
                console.error('Failed to fetch questions from API:', error);
                // Fallback to static technical questions
                const technicalQuestions = {
                    "web-development": [
                        "Implement a JavaScript function to debounce user input for a search bar, explaining your logic.",
                        "Write a RESTful API endpoint using Node.js to fetch user data, including error handling.",
                        "Explain how to optimize a React application for performance, with a focus on rendering."
                    ],
                    "data-science": [
                        "Write a Python function to preprocess a dataset with missing values, explaining your approach.",
                        "Implement a linear regression model using scikit-learn and explain how you evaluate its performance.",
                        "Describe how to tune hyperparameters for a machine learning model, with a code example."
                    ],
                    "civil-engineering": [
                        "Design a function to calculate the load-bearing capacity of a concrete beam, explaining your steps.",
                        "Write a script to analyze structural stability using finite element analysis principles.",
                        "Explain the logic behind selecting materials for a sustainable bridge design."
                    ],
                    "marketing": [
                        "Create a JavaScript function to analyze click-through rates for a digital campaign, explaining your logic.",
                        "Write a script to automate A/B testing for email marketing, including metrics to track.",
                        "Explain how to design a social media campaign using data-driven insights, with a code snippet."
                    ],
                    "mechanical": [
                        "Write a Python function to simulate stress analysis on a mechanical component, explaining your approach.",
                        "Implement a script to calculate thermodynamic efficiency for a heat engine, with clear logic.",
                        "Explain how to optimize a mechanical design for weight reduction, including a code example."
                    ]
                };
                return domain ? technicalQuestions[domain] || technicalQuestions["web-development"] : technicalQuestions["web-development"];
            }
        }
        return this.getQuestions().general; // Fallback
    }

    async generateFeedback() {
        const question = this.questions[this.currentQuestionIndex];
        const audioFile = this.uploadedAudioFile || this.audioFiles[this.currentQuestionIndex] || 'unknown.mp3';
        const secs = this.getMockDuration(audioFile);
        const transcript = this.mockTranscribe(audioFile);
        const { bucket: durationBucket, score: lenScore } = this.durationBucketAndScore(secs);
        const { score: kwScore, details: kwDetails } = this.keywordScore(transcript);
        const { score: stScore, parts: stParts } = this.structureScore(transcript);
        const { score: clScore, info: clInfo } = this.clarityScore(transcript);
        const gptFeedback = await this.simulateGPTFeedback(question, transcript, this.selectedOptions.interviewType);
        const overall = (
            this.WEIGHTS.length * lenScore +
            this.WEIGHTS.keywords * kwScore +
            this.WEIGHTS.structure * stScore +
            this.WEIGHTS.clarity * clScore
        ) * 10;
        const verdict = this.ruleBasedVerdict(durationBucket, secs, kwScore, kwDetails, stParts, clInfo, gptFeedback);
        this.feedback.push({
            question,
            audioFile,
            duration: secs,
            durationBucket,
            lenScore,
            kwScore,
            stScore,
            clScore,
            overall: Math.round(overall * 10) / 10,
            transcript,
            kwDetails,
            stParts,
            clInfo,
            verdict,
            gptFeedback
        });
    }

    async simulateGPTFeedback(question, transcript, interviewType) {
        try {
            const response = await axios.post('/generate-feedback', {
                question,
                transcript,
                interviewType
            });
            return response.data.feedback;
        } catch (error) {
            console.error('Failed to fetch feedback from API:', error);
            // Fallback to rule-based feedback
            const isTechnical = interviewType === 'technical';
            const logicWords = ["approach", "logic", "reasoning", "solution", "steps", "implement", "code"];
            const hasLogic = logicWords.some(word => transcript.toLowerCase().includes(word));
            if (isTechnical && !hasLogic) {
                return "Explain your logic more clearly, including the steps or reasoning behind your solution.";
            } else if (isTechnical) {
                return "Good explanation of logic, but consider adding a specific code example or optimization strategy.";
            }
            return "Response is clear, but try to provide more specific examples to strengthen your answer.";
        }
    }

    ruleBasedVerdict(durationBucket, secs, kwScore, kwDetails, structParts, clarityInfo, gptFeedback) {
        const bullets = [];
        if (["Too Short", "Slightly Short"].includes(durationBucket)) {
            bullets.push(`• Answer was ${durationBucket.toLowerCase()} (${secs.toFixed(1)}s). Add one concrete impact example.`);
        } else if (["Too Long", "Slightly Long"].includes(durationBucket)) {
            bullets.push(`• Answer was ${durationBucket.toLowerCase()} (${secs.toFixed(1)}s). Trim repetition and emphasize outcomes.`);
        } else {
            bullets.push(`• Good pacing at ${secs.toFixed(1)}s.`);
        }
        if (kwScore >= 0.8) {
            bullets.push("• Excellent coverage across projects, skills, outcomes, experience, and goals.");
        } else if (kwScore >= 0.6) {
            bullets.push("• Good coverage; add one more outcome/result to strengthen impact.");
        } else {
            bullets.push("• Content is thin; explicitly mention one project, the stack, and the result.");
        }
        const missing = Object.keys(structParts).filter(k => !structParts[k]);
        if (!missing.length) {
            bullets.push("• Clean structure: intro → experience → skills → goal.");
        } else {
            bullets.push("• Improve structure; missing parts: " + missing.join(", "));
        }
        const fc = clarityInfo.fillerCount;
        if (fc === 0) {
            bullets.push("• Clear delivery with no filler words.");
        } else if (fc <= 2) {
            bullets.push("• Mostly clear; reduce minor fillers.");
        } else {
            bullets.push(`• Reduce fillers (${fc}) to sound more confident.`);
        }
        bullets.push(`• AI Guidance: ${gptFeedback}`);
        const summary = (kwScore >= 0.6 && !missing.length && durationBucket === "Ideal")
            ? "Solid"
            : (durationBucket.startsWith("Slightly") || kwScore >= 0.6)
                ? "Good but can be tighter"
                : "Needs more specifics";
        return bullets.join("\n") + `\n\nSummary: ${summary}`;
    }

    getMockDuration(audioFile) {
        if (audioFile.includes('1min')) return 60;
        if (audioFile.includes('2min')) return 120;
        return 45; // Default to MIN_IDEAL
    }

    mockTranscribe(audioFile) {
        return "Hi, I'm a full-stack developer with experience in Python and React. I built a resume analyzer during my internship at Infosys, which used NLP to parse resumes. I'm looking to contribute to scalable AI projects.";
    }

    showFeedback() {
        const feedbackContainer = document.getElementById('feedback-container');
        feedbackContainer.innerHTML = '';
        this.feedback.forEach((fb, index) => {
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'feedback-item';
            feedbackDiv.innerHTML = `
                <h4>Question ${index + 1}: ${fb.question}</h4>
                <p><strong>Audio File:</strong> ${fb.audioFile}</p>
                <p><strong>Duration:</strong> ${fb.duration.toFixed(1)}s (${fb.durationBucket})</p>
                <p><strong>Keyword Score:</strong> ${fb.kwScore}</p>
                <p><strong>Structure Score:</strong> ${fb.stScore}</p>
                <p><strong>Clarity Score:</strong> ${fb.clScore}</p>
                <p><strong>Overall Score:</strong> ${fb.overall}/10</p>
                <p><strong>AI Feedback:</strong><br>${fb.gptFeedback.replace(/\n/g, '<br>')}</p>
                <p><strong>Feedback:</strong><br>${fb.verdict.replace(/\n/g, '<br>')}</p>
                <p><strong>Transcript:</strong> ${fb.transcript}</p>
            `;
            feedbackContainer.appendChild(feedbackDiv);
        });
        this.showMessage('🔍 Feedback displayed below!', 'info');
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `status-message status-${type}`;
        messageDiv.textContent = message;

        this.statusMessages.appendChild(messageDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    createFloatingDots() {
        const numberOfDots = 25;
        const container = document.querySelector('body');

        // Create dots continuously
        const createDot = () => {
            const dot = document.createElement('div');
            dot.className = 'floating-dot';

            // Random horizontal positioning
            dot.style.left = `${Math.random() * 100}vw`;
            dot.style.top = `100vh`; // Start from bottom

            // Random size (larger for better visibility)
            const size = Math.random() * 4 + 4; // Size between 4px and 8px
            dot.style.width = `${size}px`;
            dot.style.height = `${size}px`;

            // Random animation duration
            dot.style.animationDuration = `${Math.random() * 4 + 6}s`; // Duration between 6s and 10s
            
            // Random delay
            dot.style.animationDelay = `${Math.random() * 2}s`;

            container.appendChild(dot);

            // Remove dot after animation completes
            setTimeout(() => {
                if (dot.parentNode) {
                    dot.remove();
                }
            }, 12000);
        };

        // Create initial dots
        for (let i = 0; i < numberOfDots; i++) {
            setTimeout(createDot, i * 200);
        }

        // Continue creating dots
        setInterval(createDot, 500);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load voices if available
    if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = () => {
            console.log('Voices loaded:', speechSynthesis.getVoices().length);
        };
    }

    new CareerCatalyst();

    // Create floating dots after the CareerCatalyst is initialized.
});

// Add CSS for floating dots
const style = document.createElement('style');
style.innerHTML = `
.floating-dot {
    position: fixed;
    background-color: #007bff; /* Example color */
    border-radius: 50%;
    opacity: 0.6;
    pointer-events: none;
    z-index: 1000; /* Ensure dots are on top */
    animation: float 7s linear infinite;
}

@keyframes float {
    0% {
        transform: translateY(0);
    }
    100% {
        transform: translateY(-100vh);
    }
}
`;
document.head.appendChild(style);