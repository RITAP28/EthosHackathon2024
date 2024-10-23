import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectToDatabase } from '../../../db/db';
import router from './routes/routes';
import { Port } from './utils/utils';

const app = express();
const port = Port || 7070;

app.use(
    cors({
        origin: ['http://localhost:1212','http://localhost:1213', 'http://localhost:5173'],
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