import express from "express";
import cors from "cors";
import { createHandler } from "graphql-http/lib/use/express";
import { connectDb } from "./db.ts";
import { schema, rootValue } from "./schema/index.ts";

const PORT = process.env.PORT ?? 4000;

await connectDb();

const app = express();
app.use(cors());
app.all("/graphql", createHandler({ schema, rootValue }));

app.listen(PORT, () => {
    console.log(`athenaeum-service listening on http://localhost:${PORT}/graphql`);
});
