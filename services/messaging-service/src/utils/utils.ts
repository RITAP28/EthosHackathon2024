import { JwtPayload } from "jsonwebtoken";
import { Document } from "mongoose";
import { WebSocket } from "ws";
import dotenv from "dotenv";

dotenv.config();

enum GroupRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

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

export interface ExtendedDecodedToken extends JwtPayload {
  id: number;
  name: string;
  email: string;
  iat?: number;
}

export interface Sender {
  id: number;
  name: string;
  email: string;
}

export interface Receiver {
  id: number;
  name: string;
  email: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  isAuthenticated?: boolean;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  role?: GroupRole;
  joinedAt?: Date;
  userId?: number;
  groupId?: number;
}

export interface ExtendedSocketGroups {
  id: number;
  name: string;
  description: string | null;
  totalMembers: number;
  members?: Member[];
  createdAt: Date;
  updatedAt: Date;
  ownerId: number | null;
  latestText: string | null;
  latestTextSentAt: Date | null;
  latestTextSentById: number | null;
  // latestTextSentBy: User | null;
}

export interface ExtendedWebsocket extends WebSocket {
  user: ExtendedDecodedToken;
  chatPartner: ExtendedWebsocket;
  groups: ExtendedSocketGroups[]
}

export const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET as string;
export const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET as string;
export const PORT = process.env.PORT;