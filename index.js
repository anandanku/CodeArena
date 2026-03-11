import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import MongoStore from "connect-mongo";
import path from "path";
import { fileURLToPath } from "url";

/* ROUTERS */
import authRouter from "./auth.js";
import createRoomRouter from "./createroom.js";
import joinRoomRouter from "./joinroom.js";
import problemsRouter from "./problems.js";

/* ENV */
dotenv.config();

/* PATH FIX FOR ES MODULES */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* EXPRESS APP */
const app = express();

/* BODY PARSER */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* STATIC FRONTEND */
app.use(express.static(path.join(__dirname, "public")));

/* ============================= */
/* MONGODB CONNECTION (ATLAS) */
/* ============================= */

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME,
  })
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });

/* ============================= */
/* SESSION CONFIGURATION */
/* ============================= */

app.use(
  session({
    name: process.env.SESSION_NAME || "session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: process.env.MONGO_DB_NAME,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: parseInt(process.env.SESSION_MAX_AGE || "86400000"),
    },
  })
);

/* ============================= */
/* PASSPORT */
/* ============================= */

app.use(passport.initialize());
app.use(passport.session());

/* ============================= */
/* ROUTES */
/* ============================= */

/* Authentication */
app.use("/", authRouter);

/* Room creation */
app.use("/createroom", createRoomRouter);

/* Join room */
app.use("/joinroom", joinRoomRouter);

/* Fetch contest problems */
app.use("/", problemsRouter);

/* ============================= */
/* FRONTEND ROUTES */
/* ============================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/loginpage.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public/homepage.html"));
});

/* ============================= */
/* SERVER */
/* ============================= */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




