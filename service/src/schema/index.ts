import { buildSchema } from "graphql";
import { typeDefs } from "./typeDefs.ts";
import { entityResolvers } from "./resolvers/entities.ts";
import { pageResolvers } from "./resolvers/pages.ts";

export const schema = buildSchema(typeDefs);

export const rootValue = {
    health: () => "ok",
    ...pageResolvers,
    ...entityResolvers,
};
