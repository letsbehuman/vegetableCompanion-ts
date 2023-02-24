import { Application, json, urlencoded, Response, Request, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import cookieSession from 'cookie-session';
import HTTP_STATUS from 'http-status-codes';
import Logger from 'bunyan';
import 'express-async-errors';
import { config } from '@root/config';
import applicationRoutes from '@root/routes';
import { CustomError, IErrorResponse } from '@globals/helpers/error.handler';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

const SERVER_PORT = 5000;
const log: Logger = config.createLogger('setupServer'); //"server" will indentify where the log is coming from

export class VegetableCompanionServer {
  private app: Application; // instanse of express app

  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddelware(this.app);
    this.standardMiddelware(this.app);
    this.routerMiddelware(this.app);
    this.globaErrorHandler(this.app);
    this.startServer(this.app);
  }
  private securityMiddelware(app: Application): void {
    app.use(
      cookieSession({
        name: 'session',
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
        maxAge: 24 * 7 * 3600000,
        secure: config.NODE_ENV !== 'development'
      })
    );
    app.use(hpp()); //Express middleware to protect against HTTP Parameter Pollution attacks
    app.use(helmet()); //Helmet helps you secure your Express apps by setting various HTTP header
    app.use(
      cors({
        origin: config.CLIENT_URL, //final url
        credentials: true, // allows to use the cookies
        optionsSuccessStatus: 200, //for older browers
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      })
    ); //a mechanism that allows restricted resources on a web page to be requested from another domain outside the domain from which the first resource was served
  }
  private standardMiddelware(app: Application): void {
    app.use(compression()); //compress the request and response
    app.use(json({ limit: '50mb' })); // allows you send JSON data back and forth client-server
    app.use(urlencoded({ extended: true, limit: '50mb' })); // allows to use encoded data client-server
  }
  private routerMiddelware(app: Application): void {
    applicationRoutes(app);
  }
  private globaErrorHandler(app: Application): void {
    app.all('*', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: `${req.originalUrl} not found` });
    }); // this will catch request that does not exist
    app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
      log.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json(error.serializeErrors());
      }
      next();
    });
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.socketIOConnections(socketIO);
      this.startHttpServer(httpServer);
    } catch (error) {
      log.error(error);
    }
  }

  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      }
    });
    const pubClient = createClient({ url: config.REDIS_HOST });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }
  private startHttpServer(httpServer: http.Server): void {
    log.info(`Server has started with proccess ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Server running on port ${SERVER_PORT}`);
    });
  }
  private socketIOConnections(io: Server): void {}
}
