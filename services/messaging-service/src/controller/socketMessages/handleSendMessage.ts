import { prisma } from "../../../../../db/db";
import { logger } from "../../messaging.index";
import { ExtendedWebsocket } from "../../utils/utils";
import { addChatsToDatabase, createAndUpdateChatPartnersData, getUserByEmail } from "../chat.controller";

export async function handleSendMessage(
    parsedMessage: any,
    ws: ExtendedWebsocket
) {
    const chatPartnerEmail = parsedMessage.targetEmail as string;
        const SocketChatPartner = ws.chatPartner;
        console.log("chat partner email: ", chatPartnerEmail);

        const { message: textMetadata, mediaUrl } = parsedMessage;

        if (
          SocketChatPartner &&
          chatPartnerEmail === SocketChatPartner.user.email
        ) {
          console.log("socket chat partner email: ", ws.chatPartner.user.email);
          // sending the data to the client attached to the SocketChatPartner
          SocketChatPartner.send(
            JSON.stringify({
              action: "receive-message",
              mediaUrl: mediaUrl, // can be a string or null, depending upon whether image was sent or not
              textMetadata: textMetadata, // can be a string or null, depending upon whether text was sent or not
              from: ws.user.email,
              to: chatPartnerEmail,
              sentAt: new Date(Date.now()),
            })
          );
          const chatId = await addChatsToDatabase(
            ws.user.email,
            chatPartnerEmail,
            textMetadata, // string | null
            mediaUrl // string | null
          ) as number;
          if (mediaUrl !== null) {
            await prisma.media.create({
              data: {
                mediaUrl: mediaUrl,
                type: "IMAGE",
                uploadedAt: new Date(Date.now()),
                expiresAt: new Date(Date.now()),
                updatedAt: new Date(Date.now()),
                chatId: Number(chatId)
              }
            })
          }
          if (SocketChatPartner.OPEN) {
            // updating the chat row created just above
            await prisma.chat.update({
              where: {
                chatId: chatId, // find the chat row created above with the help of chatId
              },
              data: {
                receivedAt: new Date(Date.now()),
                isDelivered: true, // now the chat is sent to the receiver, so set to true
              },
            });

            await createAndUpdateChatPartnersData(
              ws.user,
              SocketChatPartner.user,
              chatPartnerEmail,
              mediaUrl,
              textMetadata
            );

            console.log(
              "the function createAndUpdateChatPartnerData ran successfully"
            );
          }
          ws.send(
            JSON.stringify({
              action: "send-message",
              message: `Message sent to ${chatPartnerEmail} successfully`,
              mediaUrl: mediaUrl, // string | null
              textMetadata: parsedMessage.message, // string | null
              from: ws.user.email,
              to: chatPartnerEmail,
              sentAt: new Date(Date.now()),
            })
          );

          console.log(`Message sent to chat partner ${chatPartnerEmail}`);
          return;
        } else if (SocketChatPartner === undefined) {
          const chatId = await addChatsToDatabase(
            ws.user.email,
            chatPartnerEmail,
            mediaUrl,
            textMetadata
          ) as number;
          await prisma.chat.update({
            where: {
              chatId: chatId,
            },
            data: {
              receivedAt: null,
              isDelivered: false,
            },
          });
          const offlineTargetUser = await getUserByEmail(chatPartnerEmail);
          await prisma.notifications.create({
            data: {
              receiverId: Number(offlineTargetUser?.id),
              receiverEmail: String(offlineTargetUser?.email),
              senderEmail: String(ws.user.email),
              mediaUrl: mediaUrl, // string | null
              title: `You have one unread message from ${ws.user.name}`,
              message: `${textMetadata}`, // string | null
              createdAt: new Date(Date.now()),
              isRead: false,
              notificationType: "receive-message",
            },
          });
          await createAndUpdateChatPartnersData(
            ws.user, // sender = defined
            SocketChatPartner, // receiver = undefined
            chatPartnerEmail, // receiver email = undefined
            mediaUrl, // string | null
            textMetadata // string | null
          );
          console.log(
            "the function createAndUpdateChatPartnerData ran successfully"
          );
        } else if (SocketChatPartner.CLOSED) {
          console.log(
            `${chatPartnerEmail} has disconnected unfortunately or is offline.`
          );
          ws.send(
            JSON.stringify({
              message: `${chatPartnerEmail} has disconnected`,
            })
          );
        } else {
          // error logger
          logger.error(
            `Chat Partner ${chatPartnerEmail} not matching with the one in the socket`,
            {
              action: "send-message",
              errorMessage: "Chat partner mismatch",
            }
          );
          ws.send(
            JSON.stringify({
              message: "Chat Partner not matching with the one in the socket",
            })
          );
          ws.close(1008, "Chat Partner mismatch"); // 1008 is for policy violation
          return;
        }
}