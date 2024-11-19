import express from "express";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cors from "cors";
import {
  accessTokenSecret,
  ExtendedDecodedToken,
  ExtendedSocketGroups,
  ExtendedWebsocket,
  Member,
  PORT,
  User,
} from "./utils/utils";
import { prisma } from "../../../db/db";
import {
  addChatsToDatabase,
  createAndUpdateChatPartnersData,
  getUndeliveredMessages,
  getUserByEmail,
} from "./controller/chat.controller";

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

enum GroupRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

wss.on("connection", async function connection(ws: ExtendedWebsocket) {
  ws.on("error", (error) => console.error(error));

  ws.on("message", async (message: string) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log("parsedMessage: ", parsedMessage);

      // first testing and authenticating the token provided by the primary client
      if (parsedMessage.action === "first-socket-authentication") {
        const token = parsedMessage.token as string;
        let decoded;
        try {
          decoded = jwt.verify(token, accessTokenSecret);
          if (
            typeof decoded === "object" &&
            decoded !== null &&
            "email" in decoded
          ) {
            // if everything's good
            const decodedToken = decoded as ExtendedDecodedToken;
            console.log("Decoded token: ", decodedToken);

            ws.user = decodedToken;
            console.log("Ws User after getting assigned: ", ws.user);

            console.log(`User with email ${decodedToken.email} has connected`);

            ws.send(
              JSON.stringify({
                message: `Welcome to the chat, ${decodedToken.email}`,
                user: ws.user,
              })
            );
          } else {
            console.log("Token does not contain required fields");
            ws.send(
              JSON.stringify({
                message: "Authentication failed",
                error: "Token does not contain required fields ",
              })
            );
            ws.close();
            return;
          }
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
      }

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

      // then, you can send anything. like here, after verifying token, we then send a request to start the chat section
      if (parsedMessage.action === "start-chat") {
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
          console.log(
            "target user socket email: ",
            targetUserSocket?.user.email
          );
        }

        if (targetUserSocket) {
          ws.chatPartner = targetUserSocket;
          targetUserSocket.chatPartner = ws;

          console.log(
            "targetUserSocket chat partner email: ",
            targetUserSocket.chatPartner.user.email
          );

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
          ws.send(
            JSON.stringify({
              message: `${targetEmail} is offline, but you can still send messages`,
            })
          );
        }
      }

      // handling the fetching of users from the database via websockets
      if (parsedMessage.action === "fetch-chat-partners") {
        const chatPartners = await prisma.chatPartners.findMany({
          where: {
            senderEmail: ws.user.email,
          },
        });
        ws.send(
          JSON.stringify({
            message: `All the chats have been fetched for ${ws.user.email} successfully`,
            status: "success",
            chatPartners: chatPartners,
          })
        );
      }

      // handling the event of creation of a new group
      if (parsedMessage.action === "create-group") {
        const groupName = parsedMessage.groupName;
        const groupDescription = parsedMessage.groupDescription;
        const usersToAdd: User[] = parsedMessage.users;

        console.log("Group Name: ", groupName);
        console.log("Group Description: ", groupDescription);
        console.log("Users to Add: ", usersToAdd);

        const listOfUsersToBeAdded: Member[] = [];

        const totalMembers = usersToAdd.length + 1;
        const ownerId = ws.user.id;
        // after validating each user in the list of users which came from parsedMessage or client, we will add the group, with all the data in hand, as a whole
        await prisma.$transaction(async (tx) => {
          // create the group with owner
          const group = await tx.group.create({
            data: {
              name: groupName,
              description: groupDescription,
              totalMembers: totalMembers,
              ownerId: ownerId,
              createdAt: new Date(Date.now()),
            },
          });

          await tx.member.create({
            data: {
              userId: ownerId,
              groupId: group.id,
              name: ws.user.name,
              email: ws.user.email,
              role: "ADMIN",
            },
          });

          if (usersToAdd.length > 0) {
            await tx.member.createMany({
              data: usersToAdd.map((user) => ({
                userId: user.id,
                groupId: group.id,
                name: user.name,
                email: user.email,
                role: "MEMBER",
              })),
            });

            await tx.group.update({
              where: {
                id: group.id,
              },
              data: {
                updatedAt: new Date(Date.now()),
              },
            });
          }

          if (group) {
            const newGroup: ExtendedSocketGroups = {
              id: group.id,
              name: group.name,
              description: String(group.description),
              totalMembers: group.totalMembers,
              ownerId: Number(group.ownerId),
              members: usersToAdd.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.id === ownerId ? GroupRole.ADMIN : GroupRole.MEMBER,
              })),
              createdAt: group.createdAt,
              updatedAt: group.updatedAt,
              latestText: null,
              latestTextSentAt: null,
              latestTextSentById: null,
            };

            console.log("List of userd to be added: ", listOfUsersToBeAdded);
            console.log(
              `Group with name ${groupName}, having admin ${ws.user.name}, has been created successfully`
            );
            console.log("new group variable filled up: ", newGroup);
            ws.groups.push(newGroup);

            ws.send(
              JSON.stringify({
                message: `Group created successfully`,
                status: "success",
              })
            );

            // notifying all the users in the group about the new group
            usersToAdd.map(async (user) => {
              const targetUserEmail: string = user.email;
              console.log("targetUserEmail: ", targetUserEmail);
              const existingUser = await prisma.user.findUnique({
                where: {
                  email: targetUserEmail,
                },
              });
              // see if the user exists in the clients list
              if (!existingUser) {
                console.log(`${targetUserEmail} does not exist`);
                ws.send(
                  JSON.stringify({
                    message: `User with ${targetUserEmail} does not exist`,
                    status: "failure",
                  })
                );
              } else {
                console.log("Existing user name: ", existingUser.name);
                wss.clients.forEach(async (client) => {
                  const clientExists = client as ExtendedWebsocket;
                  if (clientExists) {
                    console.log(
                      "one user in the group sent by the client to the server: ",
                      clientExists.user
                    );

                    const targetClientSocket = Array.from(wss.clients).find(
                      (client) => {
                        const clientInGroup = client as ExtendedWebsocket;
                        if (clientInGroup.user.email === user.email) {
                          console.log(
                            "Extended Client User Property in the group: ",
                            clientInGroup.user
                          );
                        }
                        return clientInGroup.user.email === targetUserEmail;
                      }
                    ) as ExtendedWebsocket | undefined;

                    if (
                      targetClientSocket &&
                      targetClientSocket.readyState === 1
                    ) {
                      // online users will get the message immediately
                      console.log(
                        `${targetUserEmail} is online and added to the group ${groupName} successfully`
                      );
                      targetClientSocket.groups.push(newGroup);
                      ws.send(
                        JSON.stringify({
                          message: `${targetUserEmail} is online and has been added`,
                          status: "success",
                        })
                      );
                      // sending the data to the client
                      targetClientSocket.send(
                        JSON.stringify({
                          action: "joined-group",
                          title: "Group Joined",
                          message: `You joined the group ${groupName} created by ${ws.user.name}`,
                          groupName: groupName,
                          admin: ws.user.name,
                        })
                      );
                    } else {
                      // inserting this notification into the notification table as he/she is offline
                      console.log(
                        "target user group socket email is offline: ",
                        targetUserEmail
                      );
                      ws.send(
                        JSON.stringify({
                          message: `${targetUserEmail} is offline as it's socket is closed`,
                          status: "offline but success",
                        })
                      );

                      // targetClientSocket === undefined
                      await prisma.notifications.create({
                        data: {
                          receiverId: Number(user.id),
                          receiverEmail: String(user.email),
                          senderEmail: String(ws.user.email),
                          title: `Group Joined`,
                          message: `You joined the group ${groupName} created by ${ws.user.name}`,
                          isGroup: true,
                          groupId: group.id,
                          groupName: groupName,
                          createdAt: new Date(Date.now()),
                          isRead: false,
                          notificationType: "joined-group",
                        },
                      });
                    }
                  } else {
                    console.log(
                      "Client is offline, meaning that he/she is not connected to websocket"
                    );
                    ws.send(
                      JSON.stringify({
                        message: "Client not connected to websocket",
                      })
                    );
                  }
                });
              }
            });
          } else {
            console.log("Group creation failed");
            ws.send(
              JSON.stringify({
                message: "group creation failed by transaction",
                status: "failure",
              })
            );
          }
        });
      }

      // handling messages between the client and the target user account
      if (parsedMessage.action === "send-message") {
        const chatPartnerEmail = parsedMessage.targetEmail as string;
        const SocketChatPartner = ws.chatPartner;
        console.log("chat partner email: ", chatPartnerEmail);

        if (
          SocketChatPartner &&
          chatPartnerEmail === SocketChatPartner.user.email
        ) {
          console.log("socket chat partner email: ", ws.chatPartner.user.email);
          // sending the data to the client attached to the SocketChatPartner
          SocketChatPartner.send(
            JSON.stringify({
              action: "receive-message",
              textMetadata: parsedMessage.message,
              from: ws.user.email,
              to: chatPartnerEmail,
              sentAt: new Date(Date.now()),
            })
          );
          const chatId = await addChatsToDatabase(
            ws.user.email,
            chatPartnerEmail,
            parsedMessage.message
          );
          if (SocketChatPartner.OPEN) {
            // updating the chat model
            await prisma.chat.update({
              where: {
                chatId: chatId,
              },
              data: {
                receivedAt: new Date(Date.now()),
                isDelivered: true,
              },
            });

            await createAndUpdateChatPartnersData(
              ws.user,
              SocketChatPartner.user,
              chatPartnerEmail,
              parsedMessage.message
            );

            console.log(
              "the function createAndUpdateChatPartnerData ran successfully"
            );
          }
          ws.send(
            JSON.stringify({
              action: "send-message",
              message: `Message sent to ${chatPartnerEmail} successfully`,
              textMetadata: parsedMessage.message,
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
            parsedMessage.message
          );
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
              title: `You have one unread text message from ${ws.user.name}`,
              message: `${parsedMessage.message}`,
              createdAt: new Date(Date.now()),
              isRead: false,
              notificationType: "receive-message",
            },
          });
          await createAndUpdateChatPartnersData(
            ws.user, // sender = defined
            SocketChatPartner, // receiver = undefined
            chatPartnerEmail, // receiver email = undefined
            parsedMessage.message // text metadata
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
          console.log(
            `Chat Partner ${chatPartnerEmail} not matching with the one in the socket`
          );
          ws.send(
            JSON.stringify({
              message: "Chat Partner not matching with the one in the socket",
            })
          );
          ws.close(1008, "Chat Partner mismatch"); // 1008 is for policy violation
          return;
        }
      } else if (parsedMessage.action === "receive-message") {
        const senderEmail = parsedMessage.from as string;
        console.log("receive-message sender email: ", senderEmail);
        ws.send(
          JSON.stringify({
            message: `Received message from ${senderEmail} successfully`,
            textMetadata: parsedMessage.textMetadata,
            from: parsedMessage.from,
            to: parsedMessage.to,
            sentAt: parsedMessage.sentAt,
            receivedAt: new Date(Date.now()),
          })
        );
        console.log(`Received message from ${senderEmail}`);
      }

      // for actions regarding groups
      if (parsedMessage.action === "send-group-message") {
        const targetGroup: ExtendedSocketGroups = parsedMessage.targetGroup;
        console.log("target group: ", targetGroup);

        const senderId: number = parsedMessage.senderId;

        const textMetadata = String(parsedMessage.textMetadata);
        // let recentGroupText: ExtendedSocketGroups;

        ws.groups.forEach(async (group) => {
          if (group.id === targetGroup.id) {
            console.log(`Target Group received from the client: `, group.name);
            console.log(
              "Group name in the socket of user: ",
              group.name
            );

            const allMembers = targetGroup.members as Member[];
            console.log("All Members including the sender: ", allMembers);
            const groupMembersExceptSender = [] as Member[];
            for (const member of allMembers) {
              if (member.email !== ws.user.email)
                groupMembersExceptSender.push(member);
            }
            console.log(
              "Group Members except the sender: ",
              groupMembersExceptSender
            );

            const onlineGroupMembers: Member[] = [];
            const offlineGroupMembers: Member[] = [];

            // updating the group's latestText field
            await prisma.group.update({
              where: {
                id_name: {
                  id: group.id,
                  name: group.name
                }
              },
              data: {
                latestText: textMetadata,
                latestTextSentAt: new Date(Date.now()),
                latestTextSentById: senderId
              }
            });

            // broadcast the message to all the members
            await prisma.groupChat.create({
              data: {
                groupId: Number(group.id),
                groupName: String(group.name),
                senderId: Number(ws.user.id),
                senderName: String(ws.user.name),
                senderEmail: String(ws.user.email),
                textMetadata: textMetadata,
                sentAt: new Date(Date.now()),
                isDelivered: true,
              },
            });

            // checking which members are online and offline
            groupMembersExceptSender.forEach(async (member) => {
              const isOnlineGroupMember = Array.from(wss.clients).forEach(
                (x) => {
                  const extendedClient = x as ExtendedWebsocket;
                  if (extendedClient.user.email === member.email) {
                    console.log(
                      "extended client user property: ",
                      extendedClient.user
                    );
                  }
                  return extendedClient.user.email === member.email;
                }
              ) as ExtendedWebsocket | undefined;

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
                    isGroup: true,
                    groupName: targetGroup.name,
                    createdAt: new Date(Date.now()),
                    isRead: false,
                    notificationType: "receive-group-message",
                  },
                });
              } else if (
                isOnlineGroupMember &&
                isOnlineGroupMember.readyState === 2
              ) {
                console.log(`${isOnlineGroupMember.user.name} is online now.`);
                console.log(
                  `Info regarding ${isOnlineGroupMember.user.name}: `,
                  isOnlineGroupMember.user
                );
                onlineGroupMembers.push(member);

                // sending a message directly to the socket
                if (member.email !== isOnlineGroupMember.user.email) {
                  isOnlineGroupMember.send(
                    JSON.stringify({
                      action: "receive-group-message",
                      group: `${targetGroup}`,
                      title: `${ws.user.name} has sent a message in ${targetGroup.name}`,
                      message: `${textMetadata}`,
                      from: ws.user.name,
                      sentAt: new Date(Date.now()),
                    })
                  );
                }
              }
            });
            console.log("Offline members right now: ", offlineGroupMembers);
            console.log("Online members right now: ", onlineGroupMembers);
          }
        });
      } else if (parsedMessage.action === "receive-group-message") {
        try {
          console.log(
            `Message in ${parsedMessage.groupName}: `,
            parsedMessage.message
          );
          ws.send(
            JSON.stringify({
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
          console.log("Error receiving a text from a group: ", error);
        }
      }
    } catch (error) {
      console.error("Websocker error: ", error);
      ws.send(
        JSON.stringify({
          message: `An error occurred while processing the message`,
        })
      );
      return;
    }
  });
});
