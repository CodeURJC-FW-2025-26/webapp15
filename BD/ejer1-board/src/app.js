import express from 'express';
import mustacheExpress from 'mustache-express';
import bodyParser from 'body-parser';

import router from './router.js';
import './load_data.js';

const app = express();

// CORREGIDO: Ruta estática para salir de 'src' y encontrar 'public'
app.use(express.static('../public'));

// Moustache settings
app.set('view engine', 'html');
app.engine('html', mustacheExpress(), ".html");
// CORREGIDO: Ruta de vistas para salir de 'src' y encontrar 'views'
app.set('views', '../views');

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', router);

app.listen(3000, () => console.log('Web ready in http://localhost:3000/'));
