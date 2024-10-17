import { Request, Response } from "express";
import express from "express";
import { prisma } from "../../../../db/db";
import { wss } from "../messaging.index";
import { ExtendedWebsocket } from "../utils/utils";

export async function getUsersFromDatabase(email: string) {
  try {
    // all users are fetched from DB except the user itself
    const allUsers = await prisma.user.findMany({
      where: {
        email: {
          not: email,
        },
      },
    });
    return allUsers;
  } catch (error) {
    console.error("Error while fetching users: ", error);
  }
}

export async function findUserSocket(email: string) {
  try {
    Array.from(wss.clients).find((client) => {
      const extendedClient = client as ExtendedWebsocket;
      return extendedClient.user.user.email === email;
    });
  } catch (error) {
    console.error("Error while finding receiver socket: ", error);
  }
}

export async function addChatsToDatabase(
  senderEmail: string,
  receiverEmail: string,
  textMetadata: string
) {
  try {
    const chatAdditionResponse = await prisma.chat.create({
      data: {
        senderEmail: senderEmail,
        receiverEmail: receiverEmail,
        textMetadata: textMetadata,
        sentAt: new Date(Date.now()),
        receivedAt: null,
        isDelivered: false,
        isRead: false,
      },
    });
    console.log("new chat added to database successfully");
    return chatAdditionResponse.chatId;
  } catch (error) {
    console.error("Error while adding chats to database: ", error);
  }
}

export async function getUndeliveredMessages(receiverEmail: string) {
  try {
    // gives an array of messages
    const undeliveredMessages = await prisma.chat.findMany({
      where: {
        receiverEmail: receiverEmail,
        isDelivered: false,
      },
    });
    console.log(
      `Here are the undelivered messages for ${receiverEmail}: `,
      undeliveredMessages
    );
    return undeliveredMessages;
  } catch (error) {
    console.error(
      "Error while getting undelivered messages from database: ",
      error
    );
  }
}
