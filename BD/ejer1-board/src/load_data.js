import fs from 'node:fs/promises';
import * as db from './database.js';

let dataFile = `${db.DATA_FOLDER}/data.json`;

const dataString = await fs.readFile(DATA_FOLDER + '/' + dataFile, 'utf8');

const posts = JSON.parse(dataString);

await board.deletePosts();
for(let post of posts){
    await board.addPost(post);
}

await fs.rm(UPLOADS_FOLDER, { recursive: true, force: true });
await fs.mkdir(UPLOADS_FOLDER);
await fs.cp(DATA_FOLDER + '/images', UPLOADS_FOLDER, { recursive: true });

console.log('Demo data loaded');