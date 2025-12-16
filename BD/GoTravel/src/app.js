import express from 'express';
import mustacheExpress from 'mustache-express';
import bodyParser from 'body-parser';
import path from 'path'; 
import { fileURLToPath } from 'url'; 
import fs from 'fs';

import { router } from './router.js';



const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..'); 


const UploadDir = path.join(projectRoot, 'uploads');
if (!fs.existsSync(UploadDir)) {
    fs.mkdirSync(UploadDir);
    console.log(`Created uploads directory at ${UploadDir}`);
}
const app = express();


const partialsDir = path.join(projectRoot, 'views', 'partials');


app.use(express.static(path.join(projectRoot, 'public')));
app.use('/uploads', express.static(path.join(projectRoot, 'data', 'images')));


app.set('view engine', 'html');


app.engine('html', mustacheExpress(partialsDir));


app.set('views', path.join(projectRoot, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', router);

app.listen(3000, () => console.log('Web ready in http://localhost:3000/'));
