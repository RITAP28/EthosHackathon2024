import { WebSocketServer } from "ws";
import { prisma } from "../../../../../db/db";
import {
  ExtendedSocketGroups,
  ExtendedWebsocket,
  Member,
} from "../../utils/utils";
import { logger } from "../../messaging.index";

export async function handleAdminChangeAndExitGroup(
  wss: WebSocketServer,
  parsedMessage: any,
  ws: ExtendedWebsocket
) {
  const {
    selectedAdmin,
    oldAdmin,
    group,
  }: {
    selectedAdmin: Member;
    oldAdmin: Member;
    group: ExtendedSocketGroups;
  } = parsedMessage;

  const newAdminEmail: string = selectedAdmin.email;
  console.log("new admin email: ", newAdminEmail);

  try {
    const isNewAdminOnline = Array.from(wss.clients).find((x) => {
      const extendedClient = x as ExtendedWebsocket;
      if (extendedClient.user.email === newAdminEmail) {
        console.log("extended client user property: ", extendedClient.user);
      }
      return extendedClient.user.email === newAdminEmail;
    });

    if (!isNewAdminOnline || isNewAdminOnline === undefined) {
      await prisma.notifications.create({
        data: {
          receiverId: Number(selectedAdmin.userId),
          receiverEmail: String(selectedAdmin.email),
          senderEmail: String(oldAdmin.email),
          title: `New admin`,
          message: `You have been made the new admin of the group ${group.name} by the previous admin ${oldAdmin.name}`,
          groupId: Number(group.id),
          isGroup: true,
          groupName: String(group.name),
          createdAt: new Date(Date.now()),
          isRead: false,
          notificationType: "admin-change-and-exit-group",
        },
      });
    } else if (isNewAdminOnline && isNewAdminOnline.readyState === 1) {
      console.log(`${newAdminEmail} is online`);
      isNewAdminOnline.send(
        JSON.stringify({
          action: "admin-change-and-exit-group",
          group: group,
          title: `New admin`,
          message: `You have been made the new admin of the group ${group.name} by the previous admin ${oldAdmin.name}`,
          from: ws.user.name,
          sentAt: new Date(Date.now()),
        })
      );
    }
  } catch (error) {
    console.error(error);
    logger.error(
      "Error while making someone else admin and exiting the group",
      {
        action: "admin-change-and-exit-group",
        errorMessage: error,
      }
    );
  }
}
