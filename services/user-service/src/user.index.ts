import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectToDatabase } from '../../../db/db';
import router from './routes/routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 7070;

app.use(
    cors({
        origin: ['http://localhost:1212','http://localhost:1213'],
        credentials: true
    })
);

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(express.static("public"));
app.use('/', router());

async function startServer() {
    try {
        connectToDatabase();
        app.listen(port, () => {
            console.log(`User-Service is running at ${port}`);
        })
    } catch (error) {
        console.error(`Error starting server: `, error);
    }
};

startServer();