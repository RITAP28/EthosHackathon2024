import dotenv from "dotenv";
import { generateJWT, User } from "./utils";
import { prisma } from "../../../../db/db";
import { Request, Response } from "express";

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
            refreshTokenExpiresAt: refreshTokenExpiry
          },
        });
      } else {
        await prisma.session.update({
          where: {
            sessionId: existingSession?.sessionId,
          },
          data: {
            refreshToken: refreshToken,
            refreshTokenExpiresAt: refreshTokenExpiry,
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

export const clearTokens = async (req: Request, res: Response) => {};
