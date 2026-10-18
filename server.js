import express from 'express';
import helmet from 'helmet';
import { GoogleGenAI } from '@google/genai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'Nova AI' }));

app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'Falta configurar GEMINI_API_KEY en el servidor.' });
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) return res.status(400).json({ error: 'Escribe un mensaje antes de enviar.' });
    if (message.length > 12000) return res.status(413).json({ error: 'El mensaje es demasiado largo. Prueba con uno más corto.' });

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: { systemInstruction: 'Eres Nova AI, una asistente útil, clara y amable. Responde en español latinoamericano salvo que el usuario pida otro idioma.' }
    });
    const answer = result.text || 'No recibí una respuesta de Gemini. Inténtalo de nuevo.';
    return res.json({ answer });
  } catch (error) {
    console.error('Error en /api/chat:', error?.message || 'error desconocido');
    return res.status(502).json({ error: 'No pude conectar con Gemini. Revisa la configuración y los límites de tu API e inténtalo otra vez.' });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`Nova AI server listening on ${port}`));
