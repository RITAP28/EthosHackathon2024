import axios from 'axios';
import { useCallback, useEffect, useState } from 'react'
import { baseUrl, createConfig } from '../utils/util';
import { useAppDispatch, useAppSelector } from '../redux/hooks/hook';
import { AccessTokenRefreshSuccess, LogoutSuccess } from '../redux/slices/user.slice';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { handleApiError } from '../lib/error.handling';

export const useAuth = () => {
    const dispatch = useAppDispatch();
    const { currentUser, accessToken } = useAppSelector((state) => state.user);
    const config = createConfig(accessToken);
    const navigate = useNavigate();
    const toast = useToast();

    const [token, setToken] = useState<string>("");

    const getToken = useCallback(async (userId: number) => {
        try {
            const getTokenResponse = await axios.get(
                `${baseUrl}/readToken?id=${userId}`,
                config
            );
            console.log("Token received is: ", getTokenResponse.data);
            if (getTokenResponse.status === 500 && getTokenResponse.data.success === false) {
                console.log("Access token has expired, making a new one...");
                const refreshAccessToken = await axios.post(
                    `${baseUrl}/refresh?id=${userId}`,
                    config
                );
                console.log("access token refreshed response: ", refreshAccessToken.data);
                dispatch(AccessTokenRefreshSuccess(refreshAccessToken.data.accessToken));
                await getToken(userId);
            };
            // sets the refresh token
            setToken(getTokenResponse.data.token);
        } catch (error) {
            console.error("Error while getting token: ", error);
            const apiError = handleApiError(error);
            toast({
                title: "Error while reading token",
                description: apiError.message,
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
        }
    }, [dispatch, config, toast]);

    useEffect(() => {
        getToken(currentUser?.id as number);
    }, [currentUser?.id, getToken]);

    const handleLogout = async () => {
        try {
            const logoutResponse = await axios.post(
                `${baseUrl}/api/v1/auth/logout`,
                config
            );
            console.log("Logout message: ", logoutResponse.data);
            dispatch(LogoutSuccess());
            navigate('/');
            toast({
                title: "Logout Successful",
                description: `You have successfully logged out of Nebula. See you soon, ${currentUser?.name}`,
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
        } catch (error) {
            console.error("Error while logging out: ", error);
            const apiError = handleApiError(error);
            toast({
                title: "Logout function error",
                description: apiError.message,
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
        }
    }

    return { token, handleLogout };
}
