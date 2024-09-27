import { Request, Response } from "express";
import express from "express";
import { prisma } from "../../../../db/db";

export async function getUsersFromDatabase(email: string) {
  try {
    // all users are fetched from DB except the user itself
    const allUsers = await prisma.user.findMany({
        where: {
            email: {
                not: email
            }
        }
    });
    return allUsers;
  } catch (error) {
    console.error("Error while fetching users: ", error);
  };
};
