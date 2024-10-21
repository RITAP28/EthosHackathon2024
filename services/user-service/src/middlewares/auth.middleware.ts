import { NextFunction, Response } from "express";


export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // checking of both the refreshToken and accessToken
        
    } catch (error) {
        console.log("Error while checking if the user is authenticated: ", error);
        return res.status(500).json({
            success: false,
            msg: "Error while checking if the user is authenticated"
        });
    };
};
