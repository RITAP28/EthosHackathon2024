import express from 'express';
import { getCurrentUser, UserLoginFunction, UserRegisterFunction } from '../controllers/user.auth';

export default (router: express.Router) => {
    router.post('/register', UserRegisterFunction);
    router.post('/login', UserLoginFunction);
    router.get('/getCurrentUser', getCurrentUser);
}