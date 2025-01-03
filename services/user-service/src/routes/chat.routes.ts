import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { getGroupChatHistory, getGroupMembers, getGroupOwner, getGroupsForUser } from '../controllers/user.controller';
import { adminExitGroup, makeAdminBeforeExiting } from '../controllers/admin.controller';
import { upload } from '../middlewares/multer.middleware';
import { checkMediaUrlExpiresAt, uploadMediaFiles } from '../controllers/upload.controller';


export default (router: express.Router) => {
    router.get('/get/groups', isAuthenticated, getGroupsForUser);
    router.get('/get/group/allchat', isAuthenticated, getGroupChatHistory);
    router.get('/get/group/owner', getGroupOwner);
    router.get('/get/group/members', isAuthenticated, getGroupMembers);

    router.put('/put/group/makeAdminBeforeExiting', makeAdminBeforeExiting);
    router.delete('/delete/group/exit/admin', adminExitGroup);

    // route to upload media files like image, video or document
    router.post('/api/v1/media/upload', upload.single("imageFile"), uploadMediaFiles);
    router.put('/api/v1/media/update/expires', isAuthenticated, checkMediaUrlExpiresAt);
}