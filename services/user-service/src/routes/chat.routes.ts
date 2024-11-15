import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { getGroupChatHistory, getGroupsForUser } from '../controllers/user.actions';


export default (router: express.Router) => {
    router.get('/get/groups', isAuthenticated, getGroupsForUser);
    router.get('/get/group/allchat', isAuthenticated, getGroupChatHistory);
}