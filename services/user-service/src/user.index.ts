import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 7071;

app.use(
    cors({
        origin: ['http://localhost:1212'],
        credentials: true
    })
);

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(express.static("public"));
// app.use('/', router());

async function startServer() {
    try {
        app.listen(port, () => {
            console.log(`User-Service is running at ${port}`);
        })
    } catch (error) {
        console.error(`Error starting server: `, error);
    }
};

startServer();