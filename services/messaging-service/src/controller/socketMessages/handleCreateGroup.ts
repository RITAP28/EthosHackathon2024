import { WebSocketServer } from "ws";
import { prisma } from "../../../../../db/db";
import { logger } from "../../messaging.index";
import {
  ExtendedSocketGroups,
  ExtendedWebsocket,
  Member,
  User,
} from "../../utils/utils";

enum GroupRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export async function handleCreateGroup(
  ws: ExtendedWebsocket,
  parsedMessage: any,
  wss: WebSocketServer
) {
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

      // info logger
      logger.info("Group created successfully", {
        action: "create-group",
      });
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

              if (targetClientSocket && targetClientSocket.readyState === 1) {
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
              // error logger
              logger.error("Offline client", {
                action: "create-group",
                errorMessage: "Client is not connected to websocket",
              });
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
      // error logger
      logger.error("Group creation failed", {
        action: "create-group",
        errorMessage: "Group creation failed by transaction",
      });
      ws.send(
        JSON.stringify({
          message: "group creation failed by transaction",
          status: "failure",
        })
      );
    }
  });
}
