import { WebSocketServer } from "ws";
import { ExtendedWebsocket } from "../../utils/utils";
import { logger } from "../../messaging.index";

export async function handleStartChat(
  ws: ExtendedWebsocket,
  wss: WebSocketServer,
  parsedMessage: any
) {
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
  // console.log('targetUserSocket: ', targetUserSocket);
  console.log("targetUser email: ", targetUserSocket?.user.email);

  if (targetUserSocket === undefined) {
    console.log(`Sorry, ${targetEmail} is offline`);
  } else {
    console.log("target user socket email: ", targetUserSocket?.user.email);
  }

  if (targetUserSocket) {
    ws.chatPartner = targetUserSocket;
    targetUserSocket.chatPartner = ws;

    console.log(
      "targetUserSocket chat partner email: ",
      targetUserSocket.chatPartner.user.email
    );

    // info logger
    logger.info(`${targetEmail} connected`, {
      action: "start-chat",
    });

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
    // info logger
    logger.info(`${targetEmail} is offline, but you can still send messages`, {
      action: "start-chat",
    });

    ws.send(
      JSON.stringify({
        message: `${targetEmail} is offline, but you can still send messages`,
      })
    );
  }
}
