import express from 'express';
import cors from 'cors'
import subjectRouter from "./routes/subjects";

const app = express();
const PORT = 8000;

if(process.env.FRONTEND_URL) throw new Error('FRONTEND_URL is not set in .env file');
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}))

app.use(express.json());

app.use('/api/subjects', subjectRouter)

app.get('/', (_req, res) => {
    res.json({message: 'Express + TypeScript with Neon is ready!'});
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
