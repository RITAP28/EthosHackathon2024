import mongoose, { Model, Schema } from "mongoose";
import { Text } from "../utils/utils";

export const TextSchema: Schema = new Schema({
  senderId: {
    type: Number,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  receiverId: {
    type: Number,
    required: true,
  },
  receiverName: {
    type: String,
    required: true,
  },
  textMetadata: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    required: true,
  },
  receivedAt: {
    type: Date,
    required: true,
  },
  isDelivered: {
    type: Boolean,
    required: true,
  },
  isRead: {
    type: Boolean,
    required: true,
  },
});

const TextsDB: Model<Text> = mongoose.models.TextsDB || mongoose.model<Text>('Text', TextSchema);

export default TextsDB;
