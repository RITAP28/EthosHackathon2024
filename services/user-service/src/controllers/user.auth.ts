import { Request, Response } from "express";
import { Register } from "../utils/interfaces";

export const UserRegisterFunction = async (req: Request, res: Response) => {
    const { name, email, password } : Register = req.body;
    
}