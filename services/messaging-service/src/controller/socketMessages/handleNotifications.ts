import { prisma } from "../../../../../db/db";
import { ExtendedWebsocket } from "../../utils/utils";


export async function handleNotifications(
    ws: ExtendedWebsocket
) {
    const undeliveredNotifications = await prisma.notifications.findMany({
        where: {
          receiverId: ws.user.id,
          isRead: false,
        },
      });
      if (undeliveredNotifications && undeliveredNotifications.length > 0) {
        undeliveredNotifications.forEach(async (notification) => {
          if (notification.notificationType === "receive-message") {
            ws.send(
              JSON.stringify({
                action: "receive-message",
                textMetadata: notification.message,
                from: notification.senderEmail,
                to: notification.receiverEmail,
              })
            );
            await prisma.notifications.update({
              where: {
                id: notification.id,
              },
              data: {
                isRead: true,
              },
            });
          } else if (notification.notificationType === "joined-group") {
            const newGroup = await prisma.group.findUnique({
              where: {
                id_name: {
                  id: Number(notification.groupId),
                  name: String(notification.groupName),
                },
              },
            });
            if (newGroup !== null) {
              ws.groups.push(newGroup);
            }
            ws.send(
              JSON.stringify({
                action: "joined-group",
                title: notification.title,
                message: notification.message,
                isGroup: true,
                groupName: notification.groupName,
                from: notification.senderEmail,
                sentAt: notification.createdAt,
                receivedAt: new Date(Date.now()),
              })
            );
            await prisma.notifications.update({
              where: {
                id: notification.id,
              },
              data: {
                isRead: true,
                receivedAt: new Date(Date.now()),
              },
            });
          } else if (
            notification.notificationType === "receive-group-message"
          ) {
            const sender = await prisma.user.findUnique({
              where: {
                email: notification.senderEmail,
              },
            });
            ws.send(
              JSON.stringify({
                action: "receive-group-message",
                title: notification.title,
                message: notification.message,
                isGroup: true,
                groupName: notification.groupName,
                senderId: sender?.id,
                senderName: sender?.name,
                senderEmail: notification.senderEmail,
                sentAt: notification.createdAt,
                receivedAt: new Date(Date.now()),
              })
            );
            console.log(
              "'receive-group-message' notification sent successfully"
            );
            await prisma.notifications.update({
              where: {
                id: notification.id,
              },
              data: {
                isRead: true,
                receivedAt: new Date(Date.now()),
              },
            });
            console.log(
              "'receive-group-message' notification updated successfully"
            );
          }
        });
      }
}