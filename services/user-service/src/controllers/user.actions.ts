import { Request, Response } from "express";
import { prisma } from "../../../../db/db";
import { IdentityKeyPair, PreKeyBundle, PreKeyRecord, SignedPreKeyRecord } from "@signalapp/libsignal-client";

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
    senderEmail,
    chatPartnerName,
    chatPartnerEmail,
  } = req.body;
  try {
    const existingChatPartner = await prisma.chatPartners.findUnique({
      where: {
        senderEmail_chatPartnerEmail: {
          senderEmail: String(senderEmail),
          chatPartnerEmail: String(chatPartnerEmail)
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
        updatedAt: true
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

export async function retrieveChats(req: Request, res: Response){
  const { senderEmail, receiverEmail } = req.query;
  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          {
            senderEmail: String(senderEmail),
            receiverEmail: String(receiverEmail)
          },{
            senderEmail: String(receiverEmail),
            receiverEmail: String(senderEmail)
          }
        ]
      },
      orderBy: {
        sentAt: 'asc'
      }
    });
    return res.status(200).json({
      success: true,
      message: `Chats between sender ${senderEmail} and receiver ${receiverEmail} are retrieved successfully`,
      chats: chats
    });
  } catch (error) {
    console.error(`Error while retrieving chats from database: `, error)
    return res.status(500).json({
      success: false,
      msg: 'Internal Server Error'
    });
  };
};

export async function getLatestMessageBetweenUsers(senderEmail: string, receiverEmail: string){
  try {
    const allMessages = await prisma.chat.findMany({
      where: {
        OR: [
          {
            senderEmail: senderEmail,
            receiverEmail: receiverEmail
          },{
            senderEmail: receiverEmail,
            receiverEmail: senderEmail
          }
        ],
      },
      orderBy: {
        sentAt: 'asc'
      }
    });
    const reversedMessages = allMessages.reverse();
    return reversedMessages[0].textMetadata;
  } catch (error) {
    console.error("Error while getting latest message: ", error);
  };
};

export const generateKeys = async (req: Request, res: Response) => {
  try {
    // generating a long-term Identity Key Pair
    const identityKeyPair = IdentityKeyPair.generate();

    const publicIdentityKey = identityKeyPair.publicKey;
    const privateIdentityKey = identityKeyPair.privateKey;

    // generating a medium-term and used for session management, signed by Identity Key
    const signedPreKeyId = Math.floor(Math.random() * 10000);
    const signedPreKeyPair = SignedPreKeyRecord.new(
      signedPreKeyId,
      Date.now(),
      publicIdentityKey,
      privateIdentityKey,
      Buffer.alloc(0)
    );
    const signedPreKeyPublicKey = signedPreKeyPair.publicKey();
    const signedPreKeySignature = privateIdentityKey.sign(signedPreKeyPublicKey.serialize());

    const signedPreKeyWithSignature = SignedPreKeyRecord.new(
      signedPreKeyId,
      Date.now(),
      signedPreKeyPublicKey,
      signedPreKeyPair.privateKey(),
      signedPreKeySignature
    );

    // generating an array of One-Time PreKeys
    const numberOfPreKeys = 100;
    const preKeys = [];
    for(let i=0; i<numberOfPreKeys; i++){
      const preKeyId = Math.floor(Math.random() * 10000);
      const preKeyPair = PreKeyRecord.new(preKeyId, publicIdentityKey, privateIdentityKey);
      preKeys.push(preKeyPair);
    };

    const preKeyBundle = PreKeyBundle.new(
      100,
      169,
      preKeys[0].id(),
      preKeys[0].publicKey(),
      signedPreKeyId,
      signedPreKeyPublicKey,
      signedPreKeySignature,
      publicIdentityKey
    );

    console.log('pre key bundle: ', preKeyBundle);
    return res.status(201).json({
      success: true,
      message: "Keys generated successfully",
      publicIdentityKeyString: publicIdentityKey.serialize().toString('base64'),
      privateIdentityKeyString: privateIdentityKey.serialize().toString('base64')
    });
  } catch (error) {
    console.error(`Error while generating keys: `, error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error"
    });
  };
};