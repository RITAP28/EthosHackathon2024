import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { adminExitGroup, getGroupChatHistory, getGroupMembers, getGroupOwner, getGroupsForUser, makeAdminBeforeExiting } from '../controllers/user.actions';


export default (router: express.Router) => {
    router.get('/get/groups', isAuthenticated, getGroupsForUser);
    router.get('/get/group/allchat', isAuthenticated, getGroupChatHistory);
    router.get('/get/group/owner', getGroupOwner);
    router.get('/get/group/members', isAuthenticated, getGroupMembers);

    router.put('/put/group/makeAdminBeforeExiting', makeAdminBeforeExiting);
    router.delete('/delete/group/exit/admin', adminExitGroup);
}