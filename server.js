require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const twilio = require('twilio');
const FormData = require('form-data');

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Webhook endpoint for incoming messages
app.post('/webhook', async (req, res) => {
    const from = req.body.From;
    const mediaUrl = req.body.MediaUrl0; // URL of the voice note

    if (mediaUrl) {
        try {
            // Transcription logic (we'll add this next)
            const transcription = await transcribeAudio(mediaUrl);
            
            // Summarization logic
            const summary = await summarizeText(transcription);

            // Send response back to the user
            await client.messages.create({
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                to: from,
                body: `Resumen:\n\n ${summary}`
            });
        } catch (error) {
            console.error('Error:', error);
        }
    }

    res.sendStatus(200);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

const transcribeAudio = async (mediaUrl) => {
    // Remove the hardcoded API key
    const openaiApiKey = process.env.OPENAI_API_KEY;

    // Download the audio file locally
    const audioResponse = await axios({
        method: 'GET',
        url: mediaUrl,
        responseType: 'arraybuffer',
        auth: {
            username: accountSid,
            password: authToken,
        },
    });

    const audioFileBuffer = Buffer.from(audioResponse.data);

    // Send audio file to OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', audioFileBuffer, { filename: 'audio.mp3' }); // Adjust file type if necessary
    formData.append('model', 'whisper-1');

    const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
            headers: {
                Authorization: `Bearer ${openaiApiKey}`,
                ...formData.getHeaders(),
            },
        }
    );

    return response.data.text; // Transcription result
};

const summarizeText = async (text) => {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: [
            {
                role: "system",
                content: "Eres un asistente que resume notas de voz de manera concisa con lenguaje casual. Si son ideas separadas escribelo en parrafos diferentes. Solo responde con el resumen, no con ninguna otra cosa."
            },
            {
                role: "user",
                content: `${text}`
            }
        ],
        max_tokens: 100,
    }, {
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
    });

    return response.data.choices[0].message.content.trim();
};