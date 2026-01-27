import express from 'express';
import handlebars from 'express-handlebars';
import {Server} from 'socket.io';
import mongoose from 'mongoose';
import cookieParser from "cookie-parser";
import passport from "passport";
import { initializePassport } from "./config/passport.config.js";
import sessionsRouter from "./routes/sessionsRouter.js";
import productRouter from './routes/productRouter.js';
import cartRouter from './routes/cartRouter.js';
import viewsRouter from './routes/viewsRouter.js';
import usersRouter from "./routes/usersRouter.js";
import __dirname from './utils/constantsUtil.js';
import websocket from './websocket.js';

const app = express();

const uri = 'mongodb://127.0.0.1:27017/entrega-final';

mongoose
  .connect(uri)
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB connection error:", err.message));


//Handlebars Config
app.engine('handlebars', handlebars.engine());
app.set('views', __dirname + '/../views');
app.set('view engine', 'handlebars');

//Middlewares
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(cookieParser());
app.use("/api/users", usersRouter);


initializePassport();
app.use(passport.initialize());

//Routers
app.use('/api/products', productRouter);
app.use('/api/carts', cartRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/', viewsRouter);

const PORT = 8080;
const httpServer = app.listen(PORT, () => {
    console.log(`Start server in PORT ${PORT}`);
});

const io = new Server(httpServer);

websocket(io);