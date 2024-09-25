import express from 'express';
import { UserLoginFunction, UserRegisterFunction } from '../controllers/user.auth';

export default (router: express.Router) => {
    router.post('/register', UserRegisterFunction);
    router.post('/login', UserLoginFunction);
}