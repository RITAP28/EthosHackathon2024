import express from 'express';
import userRoutes from './user.routes'
import chatRoutes from './chat.routes';

const router = express.Router();

export default (): express.Router => {
    userRoutes(router);
    chatRoutes(router);
    return router;
}