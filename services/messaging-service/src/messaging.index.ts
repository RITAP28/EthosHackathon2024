import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { ExtendedDecodedToken, ExtendedWebsocket } from './utils/utils';
import { getUsersFromDatabase } from './controller/chat.controller';

dotenv.config();

const app = express();
const port = process.env.PORT || 7071;
const httpServer = app.listen(port, () => {
    console.log(`Messaging-service listening on ${port}`);
});

app.use(express.json());

const wss = new WebSocketServer({
    server: httpServer
});

wss.on('connection', function connection(ws: ExtendedWebsocket) {
    ws.on('error', (error) => console.error(error));

    ws.on('message', async (message: string) => {
        try {
            const token = message.toString();
            // jwt.verify can return either string or JWTPayload so we need to narrow it down
            const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY as string);
            if(typeof decoded === "object" && decoded !== null && 'email' in decoded){
                const decodedToken = decoded as ExtendedDecodedToken;
                console.log("Decodedtoken Email: ", decodedToken.email);
                console.log("Decodedtoken iat: ", decodedToken.iat);
                if(decodedToken){
                    ws.user = decodedToken;
                    console.log(`User with email ${ws.user.email} is connected!`);

                    ws.send(JSON.stringify({
                        message: `Welcome to the chat, ${ws.user.email}`
                    }));

                    ws.on('message', function(message){
                        console.log(`Received message: ${message}`);
                    });

                    ws.on('message', async function(message: string){
                        try {
                            const parsedMessage = JSON.parse(message);
                            if(parsedMessage.action === 'get-users-list'){
                                const users = await getUsersFromDatabase(ws.user.email);

                                ws.send(JSON.stringify({
                                    action: 'get-users-list',
                                    users
                                }));
                                console.log(users);
                            };
                            console.log(`Received users for user with email ${ws.user.email}`);
                        } catch (error) {
                            console.log('Socket Error while fetching list of users: ', error);
                        }
                    })

                    ws.on('error', () => {
                        console.log(`Websocket closed, user with email ${ws.user.email} has disconnected`);
                    });
                } else {
                    ws.send(JSON.stringify({
                        message: `Authentication failed`
                    }));
                    ws.close();
                };
            };
        } catch (error) {
            console.error('Websocker error: ', error);
            ws.send(JSON.stringify({
                message: `Error while authenticating the user`
            }));
            ws.close();
        };
    });
});