import express from "express";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cors from "cors";
import { ExtendedDecodedToken, ExtendedWebsocket } from "./utils/utils";
import connectToDatabase from "./config/db.connection";
import { prisma } from "../../../db/db";
import {
  addChatsToDatabase,
  getUndeliveredMessages,
} from "./controller/chat.controller";

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
  // connectToDatabase();
});

app.use(express.json());

export const wss = new WebSocketServer({
  server: httpServer,
});

wss.on("connection", function connection(ws: ExtendedWebsocket) {
  ws.on("error", (error) => console.error(error));

  ws.on("message", async (message: string) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log("parsedMessage: ", parsedMessage);

      // first testing and authenticating the token provided by the primary client
      if (parsedMessage.action === "first-socket-authentication") {
        const token = parsedMessage.token as string;
        let decoded;
        try {
          decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY as string);
          console.log("decoded: ", decoded);
          if (
            typeof decoded === "object" &&
            decoded !== null &&
            "email" in decoded
          ) {
            // if everything's good
            const decodedToken = decoded as ExtendedDecodedToken;
            console.log("Decoded token: ", decodedToken);
            console.log("Decodedtoken Email: ", decodedToken.email);

            ws.user = decodedToken;
            console.log("Ws User after getting assigned: ", ws.user);

            console.log(`User with email ${decodedToken.email} has connected`);

            ws.send(
              JSON.stringify({
                message: `Welcome to the chat, ${decodedToken.email}`,
                user: ws.user,
              })
            );
          } else {
            console.log("Token does not contain required fields");
            ws.send(
              JSON.stringify({
                message: "Authentication failed",
                error: "Token does not contain required fields ",
              })
            );
            ws.close();
            return;
          }
        } catch (error) {
          console.error("Token verification failed: ", error);
          ws.send(
            JSON.stringify({
              message: "Authentication failed",
              error: "Invalid or expired token",
            })
          );
          ws.close();
          return;
        }
      }

      // then, you can send anything. like here, after verifying token, we then send a request to start the chat section
      if (parsedMessage.action === "start-chat") {
        const targetEmail: string = parsedMessage.targetEmail;
        console.log("TargetEmail: ", targetEmail);

        const arraysOfClients = [];
        arraysOfClients.push(wss.clients);
        console.log("Array of clients: ", arraysOfClients);

        wss.clients.forEach((client) => {
          const extendedClient = client as ExtendedWebsocket;
          console.log("Extended User property: ", extendedClient.user);
        });

        const targetUserSocket = Array.from(wss.clients).find((client) => {
          const extendedClient = client as ExtendedWebsocket;
          return extendedClient?.user?.email === targetEmail;
        }) as ExtendedWebsocket | undefined;

        console.log("target user socket email: ", targetUserSocket?.user.email);

        if (targetUserSocket) {
          ws.chatPartner = targetUserSocket;
          targetUserSocket.chatPartner = ws;

          console.log(
            "targetUserSocket chat partner email: ",
            targetUserSocket.chatPartner.user.email
          );

          ws.send(
            JSON.stringify({
              message: `${targetEmail} connected`,
            })
          );
          targetUserSocket.send(
            JSON.stringify({
              message: `${ws.user.email} connected`,
            })
          );
        } else {
          console.log(`Target user ${targetEmail} not found`);
          ws.send(
            JSON.stringify({
              message: "User not connected",
            })
          );
          return;
        }
      }

      // handling messages between the client and the target user account
      if (parsedMessage.action === "send-message") {
        const chatPartner = parsedMessage.targetEmail as string;
        const SocketChatPartner = ws.chatPartner;
        console.log("chat partner email: ", chatPartner);
        if (chatPartner === SocketChatPartner.user.email) {
          // sending the data to the client attached to the SocketChatPartner
          SocketChatPartner.send(
            JSON.stringify({
              action: "receive-message",
              textMetadata: parsedMessage.message,
              from: ws.user.email,
              to: chatPartner,
            })
          );
          const chatId = await addChatsToDatabase(
            ws.user.email,
            chatPartner,
            parsedMessage.message
          );
          if (SocketChatPartner.OPEN) {
            await prisma.chat.update({
              where: {
                chatId: chatId,
              },
              data: {
                receivedAt: new Date(Date.now()),
                isDelivered: true,
              },
            });
          }
          ws.send(
            JSON.stringify({
              message: `Message sent to ${chatPartner} successfully`,
            })
          );

          console.log(`Message sent to chat partner ${chatPartner}`);
          return;
        } else {
          console.log(
            `Chat Partner ${chatPartner} not matching with the one in the socket`
          );
          ws.send(
            JSON.stringify({
              message: "Chat Partner not matching with the one in the socket",
            })
          );
          ws.close(1008, "Chat Partner mismatch"); // 1008 is for policy violation
          return;
        }
      } else if (parsedMessage.action === "receive-message") {
        const senderEmail = parsedMessage.from as string;
        ws.send(
          JSON.stringify({
            message: `Received message from ${senderEmail} successfully`,
          })
        );
        console.log(`Received message from ${senderEmail}`);
      }

      // for getting all the messages sent by others to this user while the socket connection was not established
      const undeliveredMessages = await getUndeliveredMessages(ws.user.email);

      if(undeliveredMessages && undeliveredMessages.length > 0){
        for(const message of undeliveredMessages){
          ws.send(
            JSON.stringify({
              action: 'receive-message',
              textMetadata: message.textMetadata,
              from: message.senderEmail,
              to: message.receiverEmail
            })
          );

          await prisma.chat.update({
            where: {
              chatId: message.chatId
            },
            data: {
              receivedAt: new Date(Date.now()),
              isDelivered: true
            }
          })
        };
      };
      
    } catch (error) {
      console.error("Websocker error: ", error);
      ws.send(
        JSON.stringify({
          message: `An error occurred while processing the message`,
        })
      );
      return;
    }
  });
});
