import express, { response } from 'express';
import path from 'path';
import cors from 'cors';
import routes from './routes';
import { errors } from 'celebrate';
//Request param = Parâmetros  quem vem na própria  rota que indentificam um recurso
//Query param = 

const app = express();
//Funcionalidade a mais no express
app.use(cors());
app.use(express.json());
app.use(routes);

app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.use(errors());//Vai lidar automaticamente em como retornar os erros para o front-end

app.listen(3333);