import express  from "express";
import dotenv from "dotenv"; //para lectura del archivo .env
import cors from "cors"; //para permitir solicitudes desde el frontend

dotenv.config();

const app = express();

const PORT  = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());


app.get('/', (req, res) => {                                                                                                 
    res.json({ message: 'Backend funcionando!' });                                                                             
});

app.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`);
})