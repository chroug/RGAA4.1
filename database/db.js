import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Erreur de connexion à PostgreSQL', err.stack);
    } else {
        console.log('✅ Connecté à PostgreSQL avec succès');
    }
    if (release) release();
});

export default pool;