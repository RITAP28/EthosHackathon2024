import express from "express";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cors from "cors";
import { ExtendedDecodedToken, ExtendedWebsocket } from "./utils/utils";

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
  ws.on("error", (error) => console.error(error));

  ws.on("message", async (message: string) => {
    try {
      const parsedMessage = JSON.parse(message);

      // first testing and authenticating the token provided by the primary client
      if (parsedMessage.token) {
        const token = parsedMessage.token as string;
        let decoded;
        try {
          decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY as string);
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

        if (
          typeof decoded === "object" &&
          decoded !== null &&
          "email" in decoded
        ) {
          // if everything's good
          const decodedToken = decoded as ExtendedDecodedToken;
          console.log("Decodedtoken Email: ", decodedToken.user.email);

          ws.user = decodedToken;

          console.log(
            `User with email ${decodedToken.user.email} has connected`
          );

          ws.send(
            JSON.stringify({
              message: `Welcome to the chat, ${decodedToken.user.email}`,
            })
          );
        } else {
          ws.send(
            JSON.stringify({
              message: "Authentication failed",
              error: "Token does not contain required fields ",
            })
          );
        }
      } else {
        ws.send(
          JSON.stringify({
            message: "Authentication failed",
            error: "No token provided",
          })
        );
        ws.close();
        return;
      }

      // then, you can send anything. like here, after verifying token, we then send a request to start the chat section
      if (parsedMessage.action === "start-action") {
        const targetEmail: string = parsedMessage.targetEmail;

        const targetUserSocket = Array.from(wss.clients).find((client) => {
          const extendedClient = client as ExtendedWebsocket;
          return extendedClient.user?.user?.email === targetEmail;
        }) as ExtendedWebsocket;

        if (targetUserSocket) {
          ws.chatPartner = targetUserSocket;
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
              message: "User not connected",
            })
          );
          ws.close();
          return;
        }
      }

      // handling messages between the client and the target user account
      if (parsedMessage.action === "send-message") {
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
              message: "Chat Partner not connected",
            })
          );
          ws.close();
          return;
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
      return;
    }
  });
});
