import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "./utils";

export const sendTokenAfterRegistration = async (
  user: User,
  statusCode: number,
  res: Response
) => {
  const token = jwt.sign(
    {
      email: user.email,
    },
    process.env.TOKEN_SECRET_KEY as string
  );

  const options = {
    expires: new Date(
      Date.now() + Number(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: false,
    sameSite: true,
  };

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: user.email,
      },
    });

    await prisma.session.create({
      data: {
        userId: existingUser?.id as number,
        token: token,
        expiresAt: options.expires
      }
    });
    return res.status(statusCode).cookie("token", token, options).json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    console.log("Error while inserting a session into the database: ", error);
    return res.status(500).json({
      success: false,
      msg: "Error while inserting a session into the database"
    });
  };
};

export const sendTokenAfterLogin = async (
  user: User,
  statusCode: number,
  res: Response
) => {
  const token = jwt.sign(
    {
      email: user.email,
    },
    process.env.TOKEN_SECRET_KEY as string
  );

  const options = {
    expires: new Date(
      Date.now() + Number(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: false,
    sameSite: true,
  };

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: user.email,
      },
    });

    const session = await prisma.session.findUnique({
      where: {
        userId: existingUser?.id
      }
    });

    if(!session){
      await prisma.session.create({
        data: {
          userId: existingUser?.id as number,
          token: token,
          expiresAt: options.expires
        }
      });
    };

    await prisma.session.update({
      where: {
        sessionId: session?.sessionId
      },
      data: {
        token: token,
        expiresAt: options.expires
      }
    });
  } catch (error) {
    console.log("Error while inserting a session into the database: ", error);
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};
