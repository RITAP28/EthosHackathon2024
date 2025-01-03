import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { prisma } from "../../../../db/db";
import { accessTokenSecret } from "../utils/utils";

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // checking of both the refreshToken and accessToken
        const authHeader = req.headers['authorization'];
        const accessToken = authHeader && authHeader.split(' ')[1];

        if(!accessToken || accessToken === undefined){
            return res.status(401).json({
                success: false,
                msg: 'No access token found'
            });
        };

        const decodedAccessToken = jwt.verify(
            accessToken,
            accessTokenSecret
        ) as {
            userId: number
        };

        const user = await prisma.user.findFirst({
            where: {
                id: decodedAccessToken.userId
            }
        });

        if(!user){
            return res.status(401).json({
                success: false,
                msg: "Invalid Access Token. User unauthorised."
            });
        };

        next();
    } catch (error) {
        console.log("Error while checking if the user is authenticated: ", error);
        return res.status(500).json({
            success: false,
            msg: "Error while checking if the user is authenticated"
        });
    };
};
