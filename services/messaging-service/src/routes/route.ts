import express from 'express';
import { insertingChatPartnerintoDB } from '../controller/chat.controller';

const router = express.Router();

export default (): express.Router => {
    router.post('/insertchatpartner', insertingChatPartnerintoDB);
    return router;
}