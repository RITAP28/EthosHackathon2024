import { Request, Response } from "express";
import { Login, Register, UserLoginSchema, UserRegisterSchema } from "../utils/utils";
import bcrypt from "bcrypt";
import { sendToken } from "../utils/send.token";
import { prisma } from '../../../../db/db'

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
        isAuthenticated: true
      },
    });

    console.log("New User created and saved in the database");
    return await sendToken(newUser, 200, res);
  } catch (error) {
    console.error("Validation failed: ", error);
    return res.status(500).json({
        success: false,
        msg: "Internal Server Error"
    });
  }
};

export const UserLoginFunction = async (req: Request, res: Response) => {
    try {
        const { email, password }: Login = req.body;
        if(!email || !password){
            return res.status(401).json({
                success: false,
                msg: "Lacking valid authentication credentials"
            });
        };
        const userData = {
            email: email,
            password: password
        };

        const loggedUser = UserLoginSchema.parse(userData);

        // checking if the user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                email: loggedUser.email
            }
        });
        if(!existingUser){
            return res.status(404).json({
                success: false,
                msg: "User not found"
            });
        };

        const validPassword = await bcrypt.compare(loggedUser.password, existingUser.password);
        if(!validPassword){
            return res.status(401).json({
                success: false,
                msg: "Invalid credentials"
            });
        };

        await prisma.user.update({
            where: {
                email: loggedUser.email
            },
            data: {
                isAuthenticated: true
            }
        });

        return await sendToken(existingUser, 200, res);
    } catch (error) {
        console.error("Login failed: ", error);
        return res.status(500).json({
            success: false,
            msg: "Internal Server Error"
        });
    };
};
