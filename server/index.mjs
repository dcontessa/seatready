import dotenv from "dotenv";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import express from "express";
import { createStore } from "./store.mjs";
import { createProviders } from "./providers.mjs";
import { createApp } from "./app.mjs";
dotenv.config({ path: ".env.local", quiet: true });
const store = createStore(resolve(".data/seatready.sqlite"));
const app = createApp({ store, providers: createProviders(process.env) });
if (existsSync("dist")) app.use(express.static(resolve("dist")));
const port = Number(process.env.PORT || 4181);
app.listen(port, "127.0.0.1", () =>
  console.log(`SeatReady API: http://localhost:${port} (sandbox only)`),
);
