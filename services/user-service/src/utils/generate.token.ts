import dotenv from "dotenv";
import { accessTokenExpiry, accessTokenSecret, generateJWT, refreshTokenExpiry, refreshTokenSecret, User } from "./utils";
import { prisma } from "../../../../db/db";
import { Request, Response } from "express";

dotenv.config();

const refreshExpiry = Date.now() + refreshTokenExpiry * 24 * 60 * 60 * 1000;
const accessExpiry = Date.now() + accessTokenExpiry * 15 * 60 * 1000;

export const generateAuthTokens = async (
  user: User,
  statusCode: number,
  res: Response
) => {
  // generating a refresh token
  const refreshToken = generateJWT(
    user.id,
    user.name,
    user.email,
    refreshTokenSecret,
    refreshExpiry
  );

  // generating an access token
  const accessToken = generateJWT(
    user.id,
    user.name,
    user.email,
    accessTokenSecret,
    accessExpiry
  );

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: user.email,
      },
    });

    if (existingUser) {
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
            refreshTokenExpiresAt: refreshExpiry
          },
        });
      } else {
        await prisma.session.update({
          where: {
            sessionId: existingSession?.sessionId,
          },
          data: {
            refreshToken: refreshToken,
            refreshTokenExpiresAt: refreshExpiry,
          },
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    console.log("Token generated successfully");
    return res
      .status(statusCode)
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: true,
        expires: new Date(refreshExpiry),
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

export const clearTokens = async (req: Request, res: Response) => {};
