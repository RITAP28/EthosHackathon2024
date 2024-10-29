import express from "express";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cors from "cors";
import {
  accessTokenSecret,
  ExtendedDecodedToken,
  ExtendedWebsocket,
  PORT,
} from "./utils/utils";
import { prisma } from "../../../db/db";
import {
  addChatsToDatabase,
  createChatPartnerEntry,
  getUndeliveredMessages,
  updateChatPartnerEntry,
} from "./controller/chat.controller";

dotenv.config();

const app = express();
const port = PORT || 7071;
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

wss.on("connection", async function connection(ws: ExtendedWebsocket) {
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
          decoded = jwt.verify(token, accessTokenSecret);
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

      // for getting all the messages sent by others to this user while the socket connection was not established
      const undeliveredMessages = await getUndeliveredMessages(ws.user.email);

      if (undeliveredMessages && undeliveredMessages.length > 0) {
        for (const message of undeliveredMessages) {
          ws.send(
            JSON.stringify({
              action: "receive-message",
              textMetadata: message.textMetadata,
              from: message.senderEmail,
              to: message.receiverEmail,
            })
          );

          await prisma.chat.update({
            where: {
              chatId: message.chatId,
            },
            data: {
              receivedAt: new Date(Date.now()),
              isDelivered: true,
            },
          });
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
          if (extendedClient.user.email === targetEmail) {
            console.log("Extended Client User property: ", extendedClient.user);
          }
          return extendedClient?.user?.email === targetEmail;
        }) as ExtendedWebsocket | undefined;
        console.log('targetUserSocket: ', targetUserSocket);
        console.log("targetUser email: ", targetUserSocket?.user.email);

        if (targetUserSocket === undefined) {
          console.log(`Sorry, ${targetEmail} is offline`);
        } else {
          console.log(
            "target user socket email: ",
            targetUserSocket?.user.email
          );
        }

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
          ws.send(
            JSON.stringify({
              message: `${targetEmail} is offline, but you can still send messages`,
            })
          );
        }
      }

      // handling the fetching of users from the database via websockets
      if (parsedMessage.action === "fetch-chat-partners") {
        const chatPartners = await prisma.chatPartners.findMany({
          where: {
            senderEmail: ws.user.email,
          },
        });
        ws.send(
          JSON.stringify({
            message: `All the chats have been fetched for ${ws.user.email} successfully`,
            status: "success",
            chatPartners: chatPartners,
          })
        );
      }

      // handling messages between the client and the target user account
      if (parsedMessage.action === "send-message") {
        const chatPartnerEmail = parsedMessage.targetEmail as string;
        const SocketChatPartner = ws.chatPartner;
        console.log("chat partner email: ", chatPartnerEmail);
        if (
          SocketChatPartner &&
          chatPartnerEmail === SocketChatPartner.user.email
        ) {
          // sending the data to the client attached to the SocketChatPartner
          SocketChatPartner.send(
            JSON.stringify({
              action: "receive-message",
              textMetadata: parsedMessage.message,
              from: ws.user.email,
              to: chatPartnerEmail,
              sentAt: new Date(Date.now()),
            })
          );
          const chatId = await addChatsToDatabase(
            ws.user.email,
            chatPartnerEmail,
            parsedMessage.message
          );
          if (SocketChatPartner.OPEN) {
            // updating the chat model
            await prisma.chat.update({
              where: {
                chatId: chatId,
              },
              data: {
                receivedAt: new Date(Date.now()),
                isDelivered: true,
              },
            });

            const [existingSenderEntry, existingReceiverEntry] = await Promise.all([
              prisma.chatPartners.findUnique({
                where: {
                  senderEmail_chatPartnerEmail: {
                    senderEmail: ws.user.email,
                    chatPartnerEmail: chatPartnerEmail
                  }
                }
              }),
              prisma.chatPartners.findUnique({
                where: {
                  senderEmail_chatPartnerEmail: {
                    senderEmail: chatPartnerEmail,
                    chatPartnerEmail: ws.user.email
                  }
                }
              })
            ]);

            if(!existingSenderEntry){
              await createChatPartnerEntry(
                ws.user,
                SocketChatPartner.user,
                parsedMessage.message
              );
            } else {
              await updateChatPartnerEntry(
                ws.user,
                SocketChatPartner.user,
                parsedMessage.message
              )
            }

            if(!existingReceiverEntry){
              await createChatPartnerEntry(
                SocketChatPartner.user,
                ws.user,
                parsedMessage.message
              )
            } else {
              await updateChatPartnerEntry(
                SocketChatPartner.user,
                ws.user,
                parsedMessage.message
              )
            };
          }
          ws.send(
            JSON.stringify({
              message: `Message sent to ${chatPartnerEmail} successfully`,
            })
          );

          console.log(`Message sent to chat partner ${chatPartnerEmail}`);
          return;
        } else if (SocketChatPartner === undefined) {
          const chatId = await addChatsToDatabase(
            ws.user.email,
            chatPartnerEmail,
            parsedMessage.message
          );
          await prisma.chat.update({
            where: {
              chatId: chatId,
            },
            data: {
              receivedAt: null,
              isDelivered: false,
            },
          });
          await prisma.chatPartners.update({
            where: {
              senderEmail_chatPartnerEmail: {
                senderEmail: ws.user.email,
                chatPartnerEmail: chatPartnerEmail,
              },
            },
            data: {
              latestChat: parsedMessage.message,
              updatedAt: new Date(Date.now()),
            },
          });
          await prisma.chatPartners.update({
            where: {
              senderEmail_chatPartnerEmail: {
                senderEmail: chatPartnerEmail,
                chatPartnerEmail: ws.user.email,
              },
            },
            data: {
              latestChat: parsedMessage.message,
              updatedAt: new Date(Date.now()),
            },
          });
        } else if (SocketChatPartner.CLOSED) {
          console.log(`${chatPartnerEmail} has disconnected unfortunately or is offline.`);
          ws.send(
            JSON.stringify({
              message: `${chatPartnerEmail} has disconnected`,
            })
          );
        } else {
          console.log(
            `Chat Partner ${chatPartnerEmail} not matching with the one in the socket`
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
        console.log("receive-message sender email: ", senderEmail);
        ws.send(
          JSON.stringify({
            message: `Received message from ${senderEmail} successfully`,
            textMetadata: parsedMessage.textMetadata,
            from: parsedMessage.from,
            to: parsedMessage.to,
            sentAt: parsedMessage.sentAt,
            receivedAt: new Date(Date.now()),
          })
        );
        console.log(`Received message from ${senderEmail}`);
      }
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
