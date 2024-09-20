import { Pool } from 'pg'
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    host: 'db',
    port: 5432,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});