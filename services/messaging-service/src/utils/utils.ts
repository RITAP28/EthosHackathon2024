import { Document } from "mongoose";

export interface Text extends Document {
    senderId: number;
    senderName: string;
    receiverId: number;
    receiverName: string;
    textMetadata: string;
    sentAt: Date;
    receivedAt: Date;
    isDelivered: boolean;
    isRead: boolean;
}