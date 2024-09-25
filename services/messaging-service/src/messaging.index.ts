import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 9001;
const httpServer = app.listen(port, () => {
    console.log(`Messaging-service listening on ${port}`);
});

app.use(express.json());

const wss = new WebSocketServer({
    server: httpServer
});

wss.on('connection', function connection(ws) {
    ws.on('error', (error) => console.error(error));

    ws.on('message', function message(data, isBinary) {
        wss.clients.forEach(function each(client) {
            if(client.readyState === WebSocket.OPEN){
                client.send(data, {
                    binary: isBinary
                });
            };
        });
    });
});



