import dotenv from "dotenv";
import { generateJWT, User } from "./utils";
import { PrismaClient } from "@prisma/client";
import { Response } from "express";
const prisma = new PrismaClient();

dotenv.config();

const refreshTokenSecret = String(process.env.REFRESH_TOKEN_SECRET);
const accessTokenSecret = String(process.env.ACCESS_TOKEN_SECRET);
const refreshTokenExpiry =
  Date.now() + Number(process.env.REFRESH_TOKEN_EXPIRY) * 24 * 60 * 60 * 1000;
const accessTokenExpiry =
  Date.now() + Number(process.env.ACCESS_TOKEN_EXPIRY) * 15 * 60 * 1000;

export const generateAuthTokens = async (
  user: User,
  statusCode: number,
  res: Response
) => {
  // generating a refresh token
  const refreshToken = generateJWT(
    user.id,
    refreshTokenSecret,
    refreshTokenExpiry
  );

  // generating an access token
  const accessToken = generateJWT(
    user.id,
    accessTokenSecret,
    accessTokenExpiry
  );

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: user.email,
      },
    });

    const existingSession = await prisma.session.findUnique({
      where: {
        userId: existingUser?.id as number,
      },
    });

    if (!existingSession) {
      await prisma.session.create({
        data: {
          userId: existingUser?.id as number,
          refreshToken: refreshToken,
          refreshTokenExpiresAt: refreshTokenExpiry,
        },
      });
    }

    await prisma.session.update({
      where: {
        userId: existingUser?.id as number,
      },
      data: {
        refreshToken: refreshToken,
        refreshTokenExpiresAt: refreshTokenExpiry,
      },
    });

    return res
      .status(statusCode)
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: true,
        expires: new Date(refreshTokenExpiry),
      })
      .json({
        success: true,
        user,
        refreshToken: refreshToken,
        accessToken: accessToken,
      });
  } catch (error) {
    console.log("Error while inserting a session into the database: ", error);
    return res.status(500).json({
      success: false,
      msg: "Error while inserting a session into the database",
    });
  }
};
