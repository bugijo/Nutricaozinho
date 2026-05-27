import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './lib/http.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', apiRouter);

app.use(errorHandler);

const port = Number(process.env.PORT) || 3333;
app.listen(port, () => {
  console.log(`Nutriçãozinho API rodando em http://localhost:${port}`);
});
