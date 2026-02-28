import express from 'express';
import cors from 'cors';
import * as googleTTS from 'google-tts-api';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/tts', async (req, res) => {
    try {
        const text = req.query.text;
        const lang = req.query.lang || 'bn';

        if (!text) {
            return res.status(400).send('Text is required');
        }

        // Free and unlimited generation via google-tts-api
        // getAllAudioBase64 works for long text > 200 chars by splitting and combining
        const results = await googleTTS.getAllAudioBase64(text, {
            lang: lang,
            slow: false,
            host: 'https://translate.google.com',
            splitPunct: ',.?!'
        });

        // Combine base64 components into a single buffer
        const buffers = results.map(result => Buffer.from(result.base64, 'base64'));
        const audioBuffer = Buffer.concat(buffers);

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length,
            'Content-Disposition': 'attachment; filename="xgpt-voice.mp3"'
        });

        res.send(audioBuffer);
    } catch (error) {
        console.error('TTS Backend Error:', error);
        res.status(500).send('Failed to generate TTS');
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Free TTS Backend API running concurrently on http://localhost:${PORT}`);
});
