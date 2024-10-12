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
  };
};
