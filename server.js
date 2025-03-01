const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: message }],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error communicating with Gemini API:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error communicating with Gemini AI model' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});