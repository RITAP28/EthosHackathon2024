import express from 'express';
import userRoutes from './user.routes'

const router = express.Router();

export default (): express.Router => {
    userRoutes(router);
    return router;
}