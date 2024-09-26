import { Request, Response } from "express";
import {
  Login,
  Register,
  UserLoginSchema,
  UserRegisterSchema,
} from "../utils/utils";
import bcrypt from "bcrypt";
import { sendTokenAfterLogin, sendTokenAfterRegistration } from "../utils/send.token";
import { prisma } from "../../../../db/db";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const generateAccessToken = (
  userId: number,
  userEmail: string,
  userName: string
) => {
  const accessToken = jwt.sign(
    {
      id: userId,
      email: userEmail,
      name: userName,
    },
    process.env.ACCESS_TOKEN_SECRET_KEY as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
  return accessToken;
};

const generateRefreshToken = (
  userId: number,
  userEmail: string,
  userName: string
) => {
  const refreshToken = jwt.sign(
    {
      id: userId,
      email: userEmail,
      name: userName,
    },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
  return refreshToken;
};

const generateAccessAndRefreshToken = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!user) {
    throw new Error(`User with userId ${userId} not found`);
  }

  const accessToken = generateAccessToken(user.id, user.email, user.name);
  const refreshToken = generateRefreshToken(user.id, user.email, user.name);

  return { accessToken, refreshToken };
};

export const UserRegisterFunction = async (req: Request, res: Response) => {
  const { name, email, password }: Register = req.body;
  if (!email || !name || !password) {
    console.log("Every field must be filled");
    return res.status(400).json({
      success: false,
      msg: "All fields are required",
    });
  }
  try {
    const userData = {
      name: name,
      email: email,
      password: password,
    };
    const user = UserRegisterSchema.parse(userData);
    console.log("New User: ", user);

    // searching for a similar user
    const existingUser = await prisma.user.findFirst({
      where: {
        name: user.name,
        email: user.email,
      },
    });
    if (existingUser) {
      console.log("User already exists");
      return res.status(409).json({
        success: false,
        msg: "User already exists",
      });
    }

    const encryptedPassword = await bcrypt.hash(user.password, 10);

    // add user to the database
    const newUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: encryptedPassword,
        isAuthenticated: true,
      },
    });

    console.log("New User created and saved in the database");
    return await sendTokenAfterRegistration(newUser, 200, res);
  } catch (error) {
    console.error("Validation failed: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

export const UserLoginFunction = async (req: Request, res: Response) => {
  try {
    const { email, password }: Login = req.body;
    if (!email || !password) {
      return res.status(401).json({
        success: false,
        msg: "Lacking valid authentication credentials",
      });
    }
    const userData = {
      email: email,
      password: password,
    };

    const loggedUser = UserLoginSchema.parse(userData);

    // checking if the user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: loggedUser.email,
      },
    });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    const validPassword = await bcrypt.compare(
      loggedUser.password,
      existingUser.password
    );
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        msg: "Invalid credentials",
      });
    }

    await prisma.user.update({
      where: {
        email: loggedUser.email,
      },
      data: {
        isAuthenticated: true,
      },
    });

    return await sendTokenAfterLogin(existingUser, 200, res);
  } catch (error) {
    console.error("Login failed: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.query.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        msg: "User ID is required",
      });
    }
    const numericId = Number(userId);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        msg: "User ID must be a valid integer",
      });
    }
    const user = await prisma.user.findUnique({
      where: {
        id: numericId,
      },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      user,
      msg: "User fetched successfully",
    });
  } catch (error) {
    console.error("Error while fetching user: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

export const UserLogoutFunction = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.query.id);
    if (!userId) {
      return res.status(400).json({
        success: false,
        msg: "User ID is required",
      });
    }
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        msg: "User ID must be a valid Number",
      });
    }
    await prisma.session.delete({
      where: {
        userId: userId,
      },
    });
  } catch (error) {
    console.error("Error while logging out: ", error);
  }
};

export const readToken = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.query.id);
    if (!userId) {
      return res.status(400).json({
        success: false,
        msg: "User ID is missing",
      });
    }
    const session = await prisma.session.findUnique({
      where: {
        userId: userId,
      },
    });
    const token = session?.token as string;
    console.log("The token is: ", token);
    const decodedToken = jwt.verify(
      token,
      process.env.TOKEN_SECRET_KEY as string
    );
    return res.status(200).json({
      success: true,
      decodedToken,
      token,
      msg: "Token decoded successfully",
    });
  } catch (error) {
    console.error("Error while reading token: ", error);
  }
};
