import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { enqueue, getResult } from './queue';
import { ExecutionRequest, Language } from './types';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const SUPPORTED_LANGUAGES: Language[] = ['javascript', 'python', 'cpp'];

app.get('/health', (req, res) => {
  res.json({ status: 'ok', supportedLanguages: SUPPORTED_LANGUAGES });
});

// submit code for execution
app.post('/execute', (req, res) => {
  const { language, code, stdin } = req.body;

  if (!language || !code) {
    res.status(400).json({ error: 'language and code are required' });
    return;
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    res.status(400).json({ error: `unsupported language, use: ${SUPPORTED_LANGUAGES.join(', ')}` });
    return;
  }

  const request: ExecutionRequest = {
    id: uuidv4(),
    language,
    code,
    stdin,
    createdAt: new Date().toISOString(),
  };

  enqueue(request);

  res.status(202).json({
    id: request.id,
    status: 'pending',
    message: 'code queued for execution',
  });
});

// poll for results
app.get('/result/:id', (req, res) => {
  const result = getResult(req.params.id);

  if (!result) {
    res.status(202).json({ status: 'pending', message: 'still executing' });
    return;
  }

  res.json(result);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`code execution engine running on port ${PORT}`);
});