import { logger } from "../../messaging.index";
import { ExtendedWebsocket } from "../../utils/utils";

export async function handleReceiveGroupMessage(
  parsedMessage: any,
  ws: ExtendedWebsocket
) {
  try {
    console.log(
      `Message in ${parsedMessage.groupName}: `,
      parsedMessage.message
    );
    ws.send(
      JSON.stringify({
        action: "receive-group-message",
        title: `${parsedMessage.from} sent a message in ${parsedMessage.groupName}`,
        message: parsedMessage.message,
        from: parsedMessage.from,
        group: parsedMessage.groupName,
        sentAt: parsedMessage.sentAt,
        receivedAt: new Date(Date.now()),
      })
    );
    console.log(
      `Server successfully notified the client ${ws.user.name} of the message sent in the group ${parsedMessage.groupName}`
    );
  } catch (error) {
    logger.error("Error receiving a text from a group", {
      action: "receive-group-message",
      errorMessage: error,
    });
  }
}
