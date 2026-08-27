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
import submitionRouter from "./submitions.js";
import liveleaderboardRouter from "./liveleaderboard.js";
import healthcheckrouter from "./healthcheck.js";
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
app.use(express.static(path.join(__dirname)));

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
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname,"..","frontend","public","loginpage.html"));
});

app.use("/",authRouter);
app.use("/auth", authRouter);
/* Room creation */
app.use("/createroom", createRoomRouter);

/* Join room */
app.use("/joinroom", joinRoomRouter);

/* Fetch contest problems */
app.use("/problems", problemsRouter);

app.use("/submition",submitionRouter);

app.use("/leaderboard",liveleaderboardRouter);

app.use("/health",healthcheckrouter);

app.get("/home",(req, res) => {
  if(!req.isAuthenticated && !req.isAuthenticated()){
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname,"..","frontend","private","homepage.html"));
});

// ye wala hata do agar hai:
app.get("/contest", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "..", "frontend", "private", "contest.html"));
});


const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});








