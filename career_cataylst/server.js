require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public')); // Serve static files (index.html, script.js, style.css)

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Endpoint to generate questions
app.post('/generate-questions', async (req, res) => {
    const { domain, interviewType } = req.body;
    try {
        const prompt = `Generate 3 ${interviewType} interview questions for ${domain}, focusing on coding tasks with clear logic explanation.`;
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200
        });
        const questions = response.choices[0].message.content.split('\n').filter(q => q.trim());
        res.json({ questions });
    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ error: 'Failed to generate questions' });
    }
});

// Endpoint to generate feedback
app.post('/generate-feedback', async (req, res) => {
    const { question, transcript, interviewType } = req.body;
    try {
        const prompt = `Analyze this ${interviewType} interview response for "${question}": "${transcript}". Provide feedback, emphasizing clarity of logic for technical answers.`;
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150
        });
        const feedback = response.choices[0].message.content;
        res.json({ feedback });
    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ error: 'Failed to generate feedback' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});