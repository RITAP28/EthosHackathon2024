import { Request, Response } from "express";
import { prisma } from "../../../../db/db";

export const getUsersFromDB = async (req: Request, res: Response) => {
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
};

export async function insertingChatPartnerintoDB(req: Request, res: Response) {
  const {
    senderId,
    chatPartnerId,
    senderName,
    chatPartnerName,
    chatPartnerEmail,
  } = req.body;
  try {
    const existingChatPartner = await prisma.chatPartners.findUnique({
      where: {
        senderId_chatPartnerId: {
          senderId: Number(senderId),
          chatPartnerId: Number(chatPartnerId),
        },
      },
    });
    if (!existingChatPartner) {
      await prisma.chatPartners.create({
        data: {
          senderId: Number(senderId),
          chatPartnerId: Number(chatPartnerId),
          senderName: senderName as string,
          chatPartnerName: chatPartnerName as string,
          chatPartnerEmail: chatPartnerEmail as string,
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
        startedAt: true,
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
        role: true
      }
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
