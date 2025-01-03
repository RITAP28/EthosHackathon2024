import { prisma } from "../../../../../db/db";
import { logger } from "../../messaging.index";
import { ExtendedWebsocket } from "../../utils/utils";

export async function handleFetchChatPartners(ws: ExtendedWebsocket) {
  const chatPartners = await prisma.chatPartners.findMany({
    where: {
      senderEmail: ws.user.email,
    },
  });

  // info logger
  logger.info(`Chat partners fetched successfully for ${ws.user.name}`, {
    action: "fetch-chat-partners",
  });
  ws.send(
    JSON.stringify({
      message: `All the chats have been fetched for ${ws.user.email} successfully`,
      status: "success",
      chatPartners: chatPartners,
    })
  );
}
