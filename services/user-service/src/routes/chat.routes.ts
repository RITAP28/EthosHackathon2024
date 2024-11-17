import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { getGroupChatHistory, getGroupOwner, getGroupsForUser } from '../controllers/user.actions';


export default (router: express.Router) => {
    router.get('/get/groups', isAuthenticated, getGroupsForUser);
    router.get('/get/group/allchat', isAuthenticated, getGroupChatHistory);
    router.get('/get/group/owner', getGroupOwner);
}