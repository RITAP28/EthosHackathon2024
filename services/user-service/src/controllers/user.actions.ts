import { Request, Response } from "express";
import { prisma } from "../../../../db/db";

export async function getUsersFromDB(req: Request, res: Response) {
  const userId = Number(req.query.id);
  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      msg: "User ID is not a valid number",
    });
  }
  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }
    const allUsers = await prisma.user.findMany({
      where: {
        email: {
          not: existingUser.email,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        isAuthenticated: true,
      },
    });
    return res.status(200).json({
      success: true,
      users: allUsers,
    });
  } catch (error) {
    console.error("Error while getting users from database: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
}

export async function insertingChatPartnerintoDB(req: Request, res: Response) {
  const {
    senderId,
    chatPartnerId,
    senderName,
    senderEmail,
    chatPartnerName,
    chatPartnerEmail,
  } = req.body;
  try {
    const existingChatPartner = await prisma.chatPartners.findUnique({
      where: {
        senderEmail_chatPartnerEmail: {
          senderEmail: String(senderEmail),
          chatPartnerEmail: String(chatPartnerEmail),
        },
      },
    });
    if (!existingChatPartner) {
      await prisma.chatPartners.create({
        data: {
          senderId: Number(senderId),
          chatPartnerId: Number(chatPartnerId),
          senderName: senderName as string,
          senderEmail: senderEmail as string,
          chatPartnerName: chatPartnerName as string,
          chatPartnerEmail: chatPartnerEmail as string,
          latestChat: null,
          startedAt: new Date(Date.now()),
        },
      });
      return res.status(201).json({
        success: true,
        msg: `${chatPartnerName} has been added to the chat partners of ${senderName} successfully`,
      });
    }
    return res.status(409).json({
      success: true,
      msg: `${chatPartnerName} is already a chat partner of ${senderName}`,
    });
  } catch (error) {
    console.error("Error while inserting chat partner into db: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
}

export async function getChatPartnersFromDB(req: Request, res: Response) {
  try {
    const { senderId } = req.query;
    const chatPartners = await prisma.chatPartners.findMany({
      where: {
        senderId: Number(senderId),
      },
      select: {
        id: true,
        chatPartnerId: true,
        chatPartnerName: true,
        chatPartnerEmail: true,
        latestChat: true,
        startedAt: true,
        updatedAt: true,
      },
    });
    return res.status(200).json({
      success: true,
      chatPartners: chatPartners,
      msg: `chat partners for sender with id ${senderId} found successfully`,
    });
  } catch (error) {
    console.error("Error while fetching chat partners from db: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
}

export async function getDetailsAboutChatPartner(req: Request, res: Response) {
  const { receiverEmail } = req.query;
  try {
    const chatPartnerName = await prisma.user.findUnique({
      where: {
        email: receiverEmail as string,
      },
      select: {
        name: true,
        isAuthenticated: true,
        role: true,
      },
    });
    if (!chatPartnerName) {
      return res.status(404).json({
        success: false,
        msg: `User with email ${receiverEmail} not found`,
      });
    }
    return res.status(200).json({
      success: true,
      msg: `User with email ${receiverEmail} found`,
      chatPartnerName: chatPartnerName,
    });
  } catch (error) {
    console.error("Error while fetching chat partner details from db: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
}

export async function getSpecificChatPartner(req: Request, res: Response) {
  try {
    const { chatPartnerId, senderId } = req.query;
    const chatPartnerById = await prisma.chatPartners.findFirst({
      where: {
        senderId: Number(senderId),
        chatPartnerId: Number(chatPartnerId),
      },
    });
    if (!chatPartnerById) {
      console.log(
        `Chat Partner of id ${chatPartnerById} does not exist for user with id ${senderId}`
      );
      return res.status(404).json({
        success: false,
        msg: `Chat Partner of id ${chatPartnerById} does not exist for user with id ${senderId}`,
      });
    }
    console.log(
      `Chat Partner of id ${chatPartnerId} found for user with id ${senderId}`
    );
    return res.status(200).json({
      success: true,
      msg: `Chat Partner of id ${chatPartnerId} found for user with id ${senderId}`,
      chatPartner: chatPartnerById,
    });
  } catch (error) {
    console.error(
      "Error while fetching the specific chat partner you requested for: ",
      error
    );
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
}

export async function retrieveChats(req: Request, res: Response) {
  const { senderEmail, receiverEmail } = req.query;
  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          {
            senderEmail: String(senderEmail),
            receiverEmail: String(receiverEmail),
          },
          {
            senderEmail: String(receiverEmail),
            receiverEmail: String(senderEmail),
          },
        ],
      },
      orderBy: {
        sentAt: "asc",
      },
    });
    return res.status(200).json({
      success: true,
      message: `Chats between sender ${senderEmail} and receiver ${receiverEmail} are retrieved successfully`,
      chats: chats,
    });
  } catch (error) {
    console.error(`Error while retrieving chats from database: `, error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
}

export async function getLatestMessageBetweenUsers(
  senderEmail: string,
  receiverEmail: string
) {
  try {
    const allMessages = await prisma.chat.findMany({
      where: {
        OR: [
          {
            senderEmail: senderEmail,
            receiverEmail: receiverEmail,
          },
          {
            senderEmail: receiverEmail,
            receiverEmail: senderEmail,
          },
        ],
      },
      orderBy: {
        sentAt: "asc",
      },
    });
    const reversedMessages = allMessages.reverse();
    return reversedMessages[0].textMetadata;
  } catch (error) {
    console.error("Error while getting latest message: ", error);
  }
}

export async function getGroupsForUser(req: Request, res: Response) {
  try {
    const { id } = req.query;
    const allGroups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: Number(id),
          },
        },
      },
      include: {
        members: true,
      },
    });
    return res.status(200).json({
      success: true,
      msg: `All groups found successfully in which the user with id, ${id} is either an admin or member`,
      groups: allGroups,
    });
  } catch (error) {
    console.error("Error while getting groups for user: ", error);
    return res.status(200).json({
      success: false,
      msg: "Groups not found",
    });
  }
}

export async function getGroupChatHistory(req: Request, res: Response) {
  try {
    const { groupId } = req.query;
    const chatHistory = await prisma.groupChat.findMany({
      where: {
        groupId: Number(groupId),
      },
    });
    if (!chatHistory) {
      return res.status(404).json({
        success: false,
        msg: `No chat history found for group with id, ${groupId}`,
      });
    } else {
      console.log(`chat history of group with id, ${groupId}: `, chatHistory);
      return res.status(200).json({
        success: false,
        msg: `Chat history found for group with id, ${groupId}`,
        chatHistory: chatHistory,
      });
    }
  } catch (error) {
    console.error("Error while fetching chat history: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
}

export async function getGroupOwner(req: Request, res: Response) {
  try {
    const { id } = req.query;
    const groupOwner = await prisma.user.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        name: true,
        email: true,
        ownedGroups: true,
        isAuthenticated: true,
      },
    });
    console.log(groupOwner);
    return res.status(200).json({
      success: true,
      msg: "Group Owner found successfully",
      groupOwner: groupOwner,
    });
  } catch (error) {
    console.error("Error while fetching group owner: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
}

export async function getGroupMembers(req: Request, res: Response) {
  try {
    const { groupId } = req.query;
    const groupMembers = await prisma.member.findMany({
      where: {
        groupId: Number(groupId),
      },
    });
    return res.status(200).json({
      success: true,
      msg: `Group members found successfully`,
      groupMembers: groupMembers,
    });
  } catch (error) {
    console.error(
      "Error while fetching group members from the server: ",
      error
    );
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
}

export async function makeAdminBeforeExiting(req: Request, res: Response) {
  try {
    const { groupId, newAdminId, oldAdminId } = req.query;
    const newAdmin = await prisma.member.update({
      where: {
        userId_groupId: {
          userId: Number(newAdminId),
          groupId: Number(groupId),
        },
      },
      data: {
        role: "ADMIN",
      },
    });
    const oldAdmin = await prisma.member.update({
      where: {
        userId_groupId: {
          userId: Number(oldAdminId),
          groupId: Number(groupId)
        }
      },
      data: {
        role: "MEMBER"
      }
    });
    console.log("New Admin: ", newAdmin);
    return res.status(201).json({
      success: true,
      msg: `Admin changes successfully`,
      oldAdmin: oldAdmin,
      newAdmin: newAdmin,
    });
  } catch (error) {
    console.error(
      "Error while making some other person admin in the server: ",
      error
    );
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
}

export async function adminExitGroup(req: Request, res: Response) {
  try {
    const { userId, groupId, newAdminId } = req.query;
    const groupToBeExited = await prisma.group.findUnique({
      where: {
        id: Number(groupId),
      },
    });
    const adminToBeExited = await prisma.member.findUnique({
      where: {
        userId_groupId: {
          userId: Number(userId),
          groupId: Number(groupId),
        },
      },
    });
    if (!groupToBeExited || !adminToBeExited) {
      return res.status(404).json({
        success: false,
        msg: "Group not found",
      });
    }
    await prisma.member.delete({
      where: {
        userId_groupId: {
          userId: Number(userId),
          groupId: Number(groupId),
        },
      },
    });
    const allMembers = await prisma.member.findMany({
      where: {
        groupId: Number(groupId),
      },
    });
    await prisma.group.update({
      where: {
        id: Number(groupId)
      },
      data: {
        totalMembers: allMembers.length,
        ownerId: Number(newAdminId),
        updatedAt: new Date(Date.now())
      }
    });
    return res.status(200).json({
      success: true,
      msg: "Previous Admin exited successfully",
      updatedMembers: allMembers
    });
  } catch (error) {
    console.error("Error while exiting group: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
}
