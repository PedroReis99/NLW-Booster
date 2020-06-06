import multer from 'multer';
import path from 'path';
import crypto from 'crypto';//Cria um hash de dados aleatório que vai ser colocado como nome da imagem que o usuario fizer upload

export default {
    storage: multer.diskStorage({
        destination: path.resolve(__dirname, '..', '..', 'uploads'),
        filename(request, file, callback) {
            const hash = crypto.randomBytes(6).toString('hex');

            const fileName = `${hash}-${file.originalname}`;//Vai concatenar o nomde original do arquivo com o hash de dados aleatórios

            callback(null, fileName);
        }
    }),
}