import express from 'express';
import mustacheExpress from 'mustache-express';
import bodyParser from 'body-parser';
import path from 'path'; 
import { fileURLToPath } from 'url'; 

import { router } from './router.js';
import './load_data.js';


const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..'); 

const app = express();


const partialsDir = path.join(projectRoot, 'views', 'partials');


app.use(express.static(path.join(projectRoot, 'public')));
app.use('/uploads', express.static(path.join(projectRoot, 'data', 'images')));


app.set('view engine', 'html');


app.engine('html', mustacheExpress(partialsDir));


app.set('views', path.join(projectRoot, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));


app.use('/', router);

app.listen(3000, () => console.log('Web ready in http://localhost:3000/'));
