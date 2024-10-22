import express from 'express';
import { getCurrentUser, readToken, refreshAccessToken, UserLoginFunction, UserLogoutFunction, UserRegisterFunction } from '../controllers/user.auth';
import { getChatPartnersFromDB, getDetailsAboutChatPartner, getUsersFromDB, insertingChatPartnerintoDB, retrieveChats } from '../controllers/user.actions';
import { isAuthenticated } from '../middlewares/auth.middleware';

export default (router: express.Router) => {
    router.post('/register', UserRegisterFunction);
    router.post('/login', UserLoginFunction);
    router.post('/logout', isAuthenticated, UserLogoutFunction);

    // route to generate access token with the help of refresh token
    router.post('/refresh', refreshAccessToken);

    router.get('/getCurrentUser', isAuthenticated, getCurrentUser);
    router.get('/readtoken', isAuthenticated, readToken);

    router.get('/getusersfromdb', isAuthenticated, getUsersFromDB);

    // routes for texting part
    router.post('/insertchatpartner', isAuthenticated, insertingChatPartnerintoDB);
    router.get('/getchatpartnersfromdb', isAuthenticated, getChatPartnersFromDB);
    router.get('/getchatpartnerdetail', isAuthenticated, getDetailsAboutChatPartner);
    router.get('/retrieveChats', isAuthenticated, retrieveChats);

    // test routes for generating key pairs
    // router.post('/createidentitykeypairs', generateKeys);
}