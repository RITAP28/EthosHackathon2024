import express from "express";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import cors from "cors";
import { ExtendedWebsocket, PORT } from "./utils/utils";
import { createLogger } from "../../shared/logger";
import { handleSocketAuth } from "./controller/socketMessages/handleSocketAuth";
import { handleNotifications } from "./controller/socketMessages/handleNotifications";
import { handleStartChat } from "./controller/socketMessages/handleStartChat";
import { handleFetchChatPartners } from "./controller/socketMessages/handleFetchChatPartners";
import { handleCreateGroup } from "./controller/socketMessages/handleCreateGroup";
import { handleSendMessage } from "./controller/socketMessages/handleSendMessage";
import { handleReceiveMessage } from "./controller/socketMessages/handleReceiveMessage";
import { handleSendGroupMessage } from "./controller/socketMessages/handleSendGroupMessage";
import { handleReceiveGroupMessage } from "./controller/socketMessages/handleReceiveGroupMessage";
import { handleAdminChangeAndExitGroup } from "./controller/socketMessages/handleAdminChangeAndExitGrp";

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

export const logger = createLogger("messaging-service");

wss.on("connection", async function connection(ws: ExtendedWebsocket) {
  ws.groups = []; // initializing the groups array in the websocket
  ws.on("error", (error) => console.error(error));

  ws.on("message", async (message: string) => {
    try {
      const parsedMessage = JSON.parse(message);
      logger.info("Received Message", {
        action: parsedMessage.action,
      });
      console.log("parsedMessage: ", parsedMessage);

      // first testing and authenticating the token provided by the primary client
      if (parsedMessage.action === "first-socket-authentication") {
        await handleSocketAuth(ws, parsedMessage);
      }

      await handleNotifications(ws);

      // then, you can send anything. like here, after verifying token, we then send a request to start the chat section
      if (parsedMessage.action === "start-chat") {
        await handleStartChat(ws, wss, parsedMessage);
      }

      // handling the fetching of users from the database via websockets
      if (parsedMessage.action === "fetch-chat-partners") {
        await handleFetchChatPartners(ws);
      }

      // handling the event of creation of a new group
      if (parsedMessage.action === "create-group") {
        await handleCreateGroup(ws, parsedMessage, wss);
      }

      // handling messages between the client and the target user account
      if (parsedMessage.action === "send-message") {
        await handleSendMessage(parsedMessage, ws);
      } else if (parsedMessage.action === "receive-message") {
        await handleReceiveMessage(ws, parsedMessage);
      }

      // for actions regarding groups
      if (parsedMessage.action === "send-group-message") {
        await handleSendGroupMessage(ws, wss, parsedMessage);
      } else if (parsedMessage.action === "receive-group-message") {
        await handleReceiveGroupMessage(parsedMessage, ws);
      } else if (parsedMessage.action === "admin-change-and-exit-group") {
        await handleAdminChangeAndExitGroup(wss, parsedMessage, ws);
      }
    } catch (error) {
      // error logger
      logger.error("Websocket error", {
        action: "websocket-connection-initiation",
        errorMessage: "An error occurred while processing the message",
      });
      ws.send(
        JSON.stringify({
          message: `An error occurred while processing the message`,
        })
      );
      return;
    }
  });
});
