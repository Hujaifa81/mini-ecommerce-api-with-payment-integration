/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { raw } from "express";
import { PaymentController } from "./app/modules/payment/payment.controller";
import passport from "passport";
import "./config/passport";
import expressSession from "express-session";
import ENV from './config/env';
import { rootResponse } from "./shared/common/rootResponse";
import { corsOptions } from "./shared/common/corsOptions";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { apiLimiter } from "./app/middlewares/rateLimiter";
import router from "./app/router";

const app = express();

// global api rate limiting
app.use("/api/v1", apiLimiter);

// web-hook api
app.use(
    "/api/v1/payment/webhook",
    raw({ type: "application/json" }),
    PaymentController.handleStripeWebhook
);

// general api
app.set("json spaces", 2);
app.get("/", rootResponse);
app.use(cors({ ...corsOptions }));
app.use(express.json());
app.use(
    expressSession({
        secret: ENV.EXPRESS_SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1", router);
app.use(notFound);
app.use(globalErrorHandler);

export default app;
