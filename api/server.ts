import * as hapi from "@hapi/hapi";
import { query } from '../scraper/db';
import { go } from "../scraper/scrapist";
import dotenv from 'dotenv';

dotenv.config();

const server: hapi.Server = new hapi.Server({
    host: '0.0.0.0',
    port: process.env.PORT
});

server.route({
    method: 'GET',
    path: '/search',
    handler: async (request, h) => {
        try {
            const params = request.query;
            console.log('hit /search');

            const q = decodeURIComponent(params.q as any);

            console.log(`query: ${q}`);

            const result = await query(`SELECT * FROM audiobook WHERE title ILIKE $1`, [`%${q}%`]);

            if (result.rows.length === 0) {
                console.log('didnt find any results... fetching from source...')
                await go(1, q);
                const tryAgain = await query(`SELECT * FROM audiobook WHERE title ILIKE $1`, [`%${q}%`]);
                console.log(`found ${tryAgain.rows.length} results from source. saved to local.`);
                return tryAgain.rows;
            } else {
                console.log('got results from local db');
                return result.rows;
            }
        } catch (e) {
            console.log(e);
        }
    }
});

async function start() {
    try {
        await server.start()
    } catch (err) {
        console.log(err);
        process.exit(1);
    } console.log('Server running at:', server.info.uri);
}

start();