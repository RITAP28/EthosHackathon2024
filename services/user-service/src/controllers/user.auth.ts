import { Request, Response } from "express";
import {
  generateJWT,
  Login,
  Register,
  UserLoginSchema,
  UserRegisterSchema,
} from "../utils/utils";
import bcrypt from "bcrypt";
import { prisma } from "../../../../db/db";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { generateAuthTokens } from "../utils/generate.token";

dotenv.config();

const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET as string;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET as string;
const accessTokenExpiry =
  Date.now() + Number(process.env.ACCESS_TOKEN_EXPIRY) * 15 * 60 * 1000;

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

    console.log(
      "New User created and saved in the database, now generating token..."
    );
    await generateAuthTokens(newUser, 200, res);
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

    console.log("Existing user is present, now generating token...");
    await generateAuthTokens(existingUser, 200, res);
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
    res.cookie("refreshToken", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
    return res.status(200).json({
      success: false,
      msg: `User with ID ${userId} logged out successfully`,
    });
  } catch (error) {
    console.error("Error while logging out: ", error);
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  const userId = Number(req.query.id);
  if (!refreshToken) {
    return res.status(204).json({
      success: false,
      msg: "No Refresh Token found",
    });
  }
  try {
    const refreshTokenFromDatabase = await prisma.session.findUnique({
      where: {
        userId: userId,
      },
    });
    const decodedRefreshToken = jwt.verify(
      refreshTokenFromDatabase?.refreshToken as string,
      refreshTokenSecret
    ) as { userId: number };

    // invalid refresh token or expired
    if (!decodedRefreshToken) {
      return res.status(401).json({
        success: false,
        msg: "Invalid Refresh Token",
      });
    }
    // checking whether the user exists in the database
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: decodedRefreshToken.userId,
        },
      });

      // user does not exist in the database
      if (!user) {
        res.cookie("refreshToken", null, {
          expires: new Date(Date.now()),
          httpOnly: true,
        });
        return res.status(404).json({
          success: false,
          msg: "User not found",
        });
      }

      // user exists in the database, then access token is generated.
      console.log("User Id matches. User is authenticated.");
      const accessToken = generateJWT(
        decodedRefreshToken.userId,
        accessTokenSecret,
        accessTokenExpiry
      );
      return res.status(200).json({
        success: true,
        accessToken: accessToken,
        msg: "Access Token refreshed successfully.",
      });
    } catch (error) {
      console.error("Error while checking whether the user exists: ", error);
      return res.status(500).json({
        success: false,
        msg: "Internal Server Error",
      });
    }
  } catch (error) {
    console.error("Error while refreshing access token: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
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
    console.log(userId);
    const session = await prisma.session.findUnique({
      where: {
        userId: userId,
      },
    });
    const token = session?.refreshToken as string;
    console.log("The token is: ", token);
    const decodedToken = jwt.verify(token, refreshTokenSecret);
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
