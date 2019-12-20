import { Pool, PoolClient } from 'pg';

const pool = new Pool({
    user: 'user',
    host: 'host.docker.internal',
    database: 'main',
    password: 'example',
    port: 5432,
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