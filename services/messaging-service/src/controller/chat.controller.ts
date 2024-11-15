import { Request, Response } from "express";
import { prisma } from "../../../../db/db";
import { wss } from "../messaging.index";
import { ExtendedWebsocket, Receiver, Sender } from "../utils/utils";

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

export async function getUserByEmail(email: string){
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    });
    return user;
  } catch (error) {
    console.error("Error while fetching user by email: ", error);
  };
};

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

export async function createChatPartnerEntry(sender: Sender, receiver: Receiver, receiverEmail: string, message: string) {
  console.log("sender: ", sender);
  console.log("receiver: ", receiver);
  try {
    if(receiver === undefined){
      const receiverInformation = await prisma.user.findUnique({
        where: {
          email: receiverEmail
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      }) as Receiver;
      console.log("Receiver Information: ", receiverInformation);
      if(receiverInformation){
        await prisma.chatPartners.update({
          where: {
            senderEmail_chatPartnerEmail: {
              senderEmail: sender.email,
              chatPartnerEmail: receiverEmail
            }
          },
          data: {
            latestChat: message,
            updatedAt: new Date(Date.now())
          }
        });
    } else {
      console.log(`No user found in the database having email ${receiverEmail}`)
    }
   } else {
      await prisma.chatPartners.create({
        data: {
          senderId: sender.id,
          senderName: sender.name,
          senderEmail: sender.email,
          chatPartnerId: receiver.id,
          chatPartnerName: receiver.name,
          chatPartnerEmail: receiver.email,
          latestChat: message,
          updatedAt: new Date(Date.now())
        }
      })
      console.log('Chat Partner entry created successfully')
    }
  } catch (error) {
    console.error('Error while creating chat partner entry: ', error);
  }
}

export async function updateChatPartnerEntry(sender: Sender, receiver: Receiver, receiverEmail: string, message: string){
  console.log("sender: ", sender);
  console.log("receiver: ", receiver);
  try {
    if(receiver === undefined){
      const receiverInformation = await prisma.user.findUnique({
        where: {
          email: receiverEmail
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      }) as Receiver;
      console.log("Receiver Information: ", receiverInformation);
      if(receiverInformation){
        await prisma.chatPartners.update({
          where: {
            senderEmail_chatPartnerEmail: {
              senderEmail: sender.email,
              chatPartnerEmail: receiverEmail
            }
          },
          data: {
            latestChat: message,
            updatedAt: new Date(Date.now())
          }
        });
      } else {
        console.log("No receiver found with email: ", receiverEmail);
      }
    } else {
      await prisma.chatPartners.update({
        where: {
          senderEmail_chatPartnerEmail: {
            senderEmail: sender.email,
            chatPartnerEmail: receiver.email
          }
        },
        data: {
          latestChat: message,
          updatedAt: new Date(Date.now())
        }
      })
    }
  } catch (error) {
    console.error("Error while updating chat partner entry: ", error);
  }
}

export async function createAndUpdateChatPartnersData(sender: Sender, receiver: Receiver, receiverEmail: string, textMetadata: string) {
  try {
    if(receiver === undefined){
      const receiverInformation = await prisma.user.findUnique({
        where: {
          email: receiverEmail
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      }) as Receiver;
      console.log("Receiver Information: ", receiverInformation);
      if(receiverInformation){
        const [existingSenderEntry, existingReceiverEntry] = await Promise.all([
          prisma.chatPartners.findUnique({
            where: {
              senderEmail_chatPartnerEmail: {
                senderEmail: sender.email,
                chatPartnerEmail: receiverInformation?.email as string
              }
            }
          }),
          prisma.chatPartners.findUnique({
            where: {
              senderEmail_chatPartnerEmail: {
                senderEmail: receiverInformation?.email as string,
                chatPartnerEmail: sender.email
              }
            }
          })
        ]);
  
        if(!existingSenderEntry){
          await createChatPartnerEntry(
            sender, // sender here
            receiverInformation, // receiver here
            receiverEmail, // receiver email here
            textMetadata
          );
        } else {
          await updateChatPartnerEntry(
            sender,
            receiverInformation,
            receiverEmail,
            textMetadata
          )
        }
        
        // vice-versa information put into the database 
        if(!existingReceiverEntry){
          await createChatPartnerEntry(
            receiverInformation, // sender here
            sender, // receiver here
            sender.email, // receiver email here
            textMetadata
          )
        } else {
          await updateChatPartnerEntry(
            receiverInformation,
            sender,
            sender.email,
            textMetadata
          )
        };
      }
    } else {
      const [existingSenderEntry, existingReceiverEntry] = await Promise.all([
        prisma.chatPartners.findUnique({
          where: {
            senderEmail_chatPartnerEmail: {
              senderEmail: sender.email,
              chatPartnerEmail: receiver.email
            }
          }
        }),
        prisma.chatPartners.findUnique({
          where: {
            senderEmail_chatPartnerEmail: {
              senderEmail: receiver.email,
              chatPartnerEmail: sender.email
            }
          }
        })
      ]);
  
      if(!existingSenderEntry){
        await createChatPartnerEntry(
          sender,
          receiver,
          receiverEmail,
          textMetadata
        );
      } else {
        await updateChatPartnerEntry(
          sender,
          receiver,
          receiverEmail,
          textMetadata
        )
      }
  
      if(!existingReceiverEntry){
        await createChatPartnerEntry(
          receiver,
          sender,
          sender.email,
          textMetadata
        )
      } else {
        await updateChatPartnerEntry(
          receiver,
          sender,
          sender.email,
          textMetadata
        )
      };
    }
  } catch (error) {
    console.error('Error while creating or updating the chat partner: ', error);
  }
}

export async function getGroupChatHistory(groupId: number) {
  try {
    const chatHistory = await prisma.groupChat.findMany({
      where: {
        groupId: groupId
      }
    });
    console.log("group chat history: ", chatHistory);
    return chatHistory;
  } catch (error) {
    console.error(`Error while fetching the chat history of the group with id ${groupId}: `, error);
  };
};
