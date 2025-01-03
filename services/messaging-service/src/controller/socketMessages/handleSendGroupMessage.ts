import { WebSocketServer } from "ws";
import { prisma } from "../../../../../db/db";
import { ExtendedSocketGroups, ExtendedWebsocket, Member } from "../../utils/utils";
import { logger } from "../../messaging.index";

export async function handleSendGroupMessage(
    ws: ExtendedWebsocket,
    wss: WebSocketServer,
    parsedMessage: any
) {
    const {
        targetGroup,
        senderId,
        textMetadata,
      }: {
        targetGroup: ExtendedSocketGroups;
        senderId: number;
        textMetadata: string;
      } = parsedMessage;

      // checking the values of the variables
      console.log("target group: ", targetGroup);
      console.log("sender id: ", senderId);
      console.log("text metadata: ", textMetadata);

      try {
        // Create message in database
        await prisma.groupChat.create({
          data: {
            groupId: Number(targetGroup.id),
            groupName: String(targetGroup.name),
            senderId: Number(ws.user.id),
            senderName: String(ws.user.name),
            senderEmail: String(ws.user.email),
            textMetadata: textMetadata,
            sentAt: new Date(Date.now()),
            isDelivered: true,
          },
        });

        // updating the group's latestText field
        await prisma.group.update({
          where: {
            id_name: {
              id: targetGroup.id,
              name: targetGroup.name,
            },
          },
          data: {
            latestText: textMetadata,
            latestTextSentAt: new Date(Date.now()),
            latestTextSentById: senderId,
          },
        });

        const groupMembersExceptSender = targetGroup.members?.filter(
          (member) => member.email !== ws.user.email
        );

        const offlineGroupMembers = [] as Member[];
        const onlineGroupMembers = [] as Member[];

        if (groupMembersExceptSender) {
          for (const member of groupMembersExceptSender) {
            const isOnlineGroupMember = Array.from(wss.clients).find((x) => {
              const extendedClient = x as ExtendedWebsocket;
              if (extendedClient.user.email === member.email) {
                console.log(
                  "extended client user property: ",
                  extendedClient.user
                );
              }
              return extendedClient.user.email === member.email;
            }) as ExtendedWebsocket | undefined;

            if (!isOnlineGroupMember || isOnlineGroupMember === undefined) {
              console.log(`${member.name} is offline.`);
              offlineGroupMembers.push(member);
              // creating a notification so that when they come online, they get notified
              await prisma.notifications.create({
                data: {
                  receiverId: Number(member.id),
                  receiverEmail: String(member.email),
                  senderEmail: String(ws.user.email),
                  title: `${ws.user.name} has sent a message in ${targetGroup.name}`,
                  message: `${textMetadata}`,
                  groupId: Number(targetGroup.id),
                  isGroup: true,
                  groupName: targetGroup.name,
                  createdAt: new Date(Date.now()),
                  isRead: false,
                  notificationType: "receive-group-message",
                },
              });
            } else if (
              isOnlineGroupMember &&
              isOnlineGroupMember.readyState === 1
            ) {
              console.log(`${isOnlineGroupMember.user.name} is online now.`);
              console.log(
                `Info regarding ${isOnlineGroupMember.user.name}: `,
                isOnlineGroupMember.user
              );
              onlineGroupMembers.push(member);

              // sending a message directly to the socket
              if (member.email === isOnlineGroupMember.user.email) {
                isOnlineGroupMember.send(
                  JSON.stringify({
                    action: "receive-group-message",
                    group: targetGroup,
                    title: `${ws.user.name} has sent a message in ${targetGroup.name}`,
                    message: `${textMetadata}`,
                    from: ws.user,
                    sentAt: new Date(Date.now()),
                  })
                );
              }
            }
          }
        }
      } catch (error) {
        logger.error("Error sending a text to the group", {
          action: "send-group-message",
          errorMessage: error,
        });
      }
}