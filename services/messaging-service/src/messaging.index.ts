import express from "express";
import { WebSocket, WebSocketServer } from "ws";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cors from "cors";
import { ExtendedDecodedToken, ExtendedWebsocket } from "./utils/utils";
import { getUsersFromDatabase } from "./controller/chat.controller";

dotenv.config();

const app = express();
const port = process.env.PORT || 7071;
app.use(
  cors({
    origin: [
      "http://localhost:1212",
      "http://localhost:1213",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
const httpServer = app.listen(port, () => {
  console.log(`Messaging-service listening on ${port}`);
});

app.use(express.json());

export const wss = new WebSocketServer({
  server: httpServer,
});

wss.on("connection", function connection(ws: ExtendedWebsocket) {
  const connectedUsers: string[] = [];
  ws.on("error", (error) => console.error(error));

  ws.on("message", async (message: string) => {
    try {
      const parsedMessage = JSON.parse(message);
      const token = parsedMessage.token as string;
      // jwt.verify can return either string or JWTPayload so we need to narrow it down
      const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY as string);
      if (
        typeof decoded === "object" &&
        decoded !== null &&
        "email" in decoded
      ) {
        const decodedToken = decoded as ExtendedDecodedToken;
        console.log("Decodedtoken Email: ", decodedToken.email);
        console.log("Decodedtoken iat: ", decodedToken.iat);
        console.log("User has been authenticated");
        if (decodedToken) {
          ws.user = decodedToken;
          console.log(`User with email ${ws.user.email} is connected!`);
          connectedUsers.push(ws.user.email);

          ws.send(
            JSON.stringify({
              message: `Welcome to the chat, ${ws.user.email}`,
            })
          );

          ws.on("message", function (message) {
            console.log(`Received message: ${message}`);
          });

          if (parsedMessage.action === "get-users-list") {
            const users = await getUsersFromDatabase(ws.user.email);

            ws.send(
              JSON.stringify({
                action: "get-users-list",
                users,
              })
            );
            console.log(users);
            console.log(`Received users for user with email ${ws.user.email}`);
          } else if (parsedMessage.action === "start-chat") {
            const targetEmail: string = parsedMessage.targetUser;
            const targetUserSocket = Array.from(wss.clients).find((client) => {
              const extendedClient = client as ExtendedWebsocket;
              return extendedClient.user.user?.email === targetEmail;
            }) as ExtendedWebsocket;
            if (targetUserSocket) {
              ws.chatPartner = targetUserSocket as ExtendedWebsocket;
              targetUserSocket.chatPartner = ws;

              ws.send(
                JSON.stringify({
                  message: `${targetEmail} connected`,
                })
              );
              targetUserSocket.send(
                JSON.stringify({
                  message: `${ws.user.user.email} connected`,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  message: `User not connected`,
                })
              );
            }
          } else if (parsedMessage.action === "send-message") {
            const chatPartner = ws.chatPartner;
            if (chatPartner) {
              chatPartner.send(
                JSON.stringify({
                  action: "receive-message",
                  textMetadata: parsedMessage.message,
                  from: ws.user.user.email,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  message: `Chat Partner not connected`,
                })
              );
            }
          }

          ws.on("error", () => {
            console.log(
              `Websocket closed, user with email ${ws.user.email} has disconnected`
            );
          });
        } else {
          ws.send(
            JSON.stringify({
              message: `Authentication failed`,
            })
          );
          ws.close();
        }
      }
    } catch (error) {
      console.error("Websocker error: ", error);
      ws.send(
        JSON.stringify({
          message: `Error while authenticating the user`,
        })
      );
      ws.close();
    }
  });
});
