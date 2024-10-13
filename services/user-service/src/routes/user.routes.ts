import express from 'express';
import { getCurrentUser, readToken, UserLoginFunction, UserLogoutFunction, UserRegisterFunction } from '../controllers/user.auth';
import { getChatPartnersFromDB, getDetailsAboutChatPartner, getUsersFromDB, insertingChatPartnerintoDB } from '../controllers/user.actions';

export default (router: express.Router) => {
    router.post('/register', UserRegisterFunction);
    router.post('/login', UserLoginFunction);
    router.post('/logout', UserLogoutFunction);
    router.get('/getCurrentUser', getCurrentUser);
    router.get('/readtoken', readToken);

    router.get('/getusersfromdb', getUsersFromDB);

    // routes for texting part
    router.post('/insertchatpartner', insertingChatPartnerintoDB);
    router.get('/getchatpartnersfromdb', getChatPartnersFromDB);
    router.get('/getchatpartnerdetail', getDetailsAboutChatPartner);
}