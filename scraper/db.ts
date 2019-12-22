import { Pool, PoolClient } from 'pg';

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASS,
    port: Number(process.env.DB_PORT),
});

export const query = (text: string, params: Array<string>) => pool.query(text, params);

export const trans = async (fnc: (client: PoolClient) => void) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        await fnc(client);
        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
};