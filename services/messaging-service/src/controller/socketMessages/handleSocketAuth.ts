import { prisma } from "../../../../../db/db";
import { logger } from "../../messaging.index";
import {
  accessTokenSecret,
  ExtendedDecodedToken,
  ExtendedWebsocket,
} from "../../utils/utils";
import jwt from "jsonwebtoken";

enum GroupRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export async function handleSocketAuth(
  ws: ExtendedWebsocket,
  parsedMessage: any
) {
  const token = parsedMessage.token as string;
  let decoded;
  try {
    decoded = jwt.verify(token, accessTokenSecret);
    if (typeof decoded === "object" && decoded !== null && "email" in decoded) {
      // if everything's good
      const decodedToken = decoded as ExtendedDecodedToken;
      ws.user = decodedToken;

      console.log(`User with email ${decodedToken.email} has connected`);

      // putting all the groups in which the user is a member or an admin, in the user's socket
      const groups = await prisma.group.findMany({
        where: {
          members: {
            some: {
              userId: ws.user.id,
            },
          },
        },
        include: {
          members: true,
        },
      });

      // transforming the groups to the format of ExtendedSocketGroups
      const transformedGroups = groups.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description || null,
        totalMembers: group.totalMembers,
        members: group.members.map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role as GroupRole,
          joinedAt: member.joinedAt,
          userId: member.userId,
          groupId: member.groupId ?? undefined,
        })),
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        ownerId: group.ownerId || null,
        latestText: group.latestText || null,
        latestTextSentAt: group.latestTextSentAt || null,
        latestTextSentById: group.latestTextSentById || null,
      }));

      ws.groups.push(...transformedGroups);
      console.log("groups in websocket: ", ws.groups);

      ws.send(
        JSON.stringify({
          message: `Welcome to the chat, ${decodedToken.email}`,
          user: ws.user,
          groups: ws.groups,
        })
      );
      logger.info("Sent Welcome Message", {
        action: "first-socket-authentication",
        userId: ws.user.id,
      });
    } else {
      logger.error("Token does not contain required fields", {
        action: "first-socket-authentication",
        errorMessage: "Authentication failed",
      });
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
    logger.error("Token verification failed", {
      action: "first-socket-authentication",
      errorMessage: "Authentication failed",
    });
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
