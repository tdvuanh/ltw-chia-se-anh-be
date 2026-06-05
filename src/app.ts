import { ENV } from "./config/env";
import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

const apiPrefix = ENV.API_URI_PREFIX ?? "api/v1";

const app: Express = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use(`/${apiPrefix}`, routes);

console.log(ENV.API_URI_PREFIX);

// 404
app.use((_req, res) => res.status(404).json({ message: "Not Found" }));

// error handler
app.use(errorHandler);

export default app;
