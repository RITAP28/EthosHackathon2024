import { logger } from "../../messaging.index";
import { ExtendedWebsocket } from "../../utils/utils";

export async function handleReceiveMessage(
  parsedMessage: any,
  ws: ExtendedWebsocket
) {
  const senderEmail = parsedMessage.from as string;
  // info logger
  logger.info(`Received message from ${senderEmail} successfully`, {
    action: "receive-message",
    receiver: ws.user.email,
    sender: senderEmail,
  });

  const { message: textMetadata, mediaUrl } = parsedMessage;

  ws.send(
    JSON.stringify({
      message: `Received message from ${senderEmail} successfully`,
      mediaUrl: mediaUrl,
      textMetadata: textMetadata,
      from: parsedMessage.from,
      to: parsedMessage.to,
      sentAt: parsedMessage.sentAt,
      receivedAt: new Date(Date.now()),
    })
  );
}
