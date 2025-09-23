const express = require("express");
const { ApolloServer, AuthenticationError } = require("apollo-server-express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http")
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");

const typeDefs = require("./schema/typeDefs");
const resolvers = require("./schema/resolvers");

const startServer = async () => {
  const app = express();
  app.use(cors());

  // Health check route
  app.get("/", (req, res) => {
    res.send("✅ Eventora GraphQL Server is running!");
  });

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const server = new ApolloServer({
    schema,
    context: ({ req }) => {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) return {};
      try {
        const user = jwt.verify(token, process.env.JWT_SECRET || "secret");
        return { user };
      } catch {
        return {};
      }
    },
  });

  await server.start();
  console.log("✅ Apollo Server started!");
  server.applyMiddleware({ app, path: "/graphql" });

  const httpServer = http.createServer(app);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  useServer(
    {
      schema,
      context: (ctx) => {
        const token = ctx.connectionParams?.authorization?.replace("Bearer ", "");
        if (!token) return {};
        try {
          const user = jwt.verify(token, process.env.JWT_SECRET || "secret");
          return { user };
        } catch {
          return {};
        }
      },
    },
    wsServer
  );

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected!");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }

  const PORT = process.env.PORT || 4000;
  const serverInstance = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server ready at http://0.0.0.0:${PORT}${server.graphqlPath}`);
  });

  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down server...");
    await mongoose.disconnect();
    serverInstance.close(() => {
      console.log("✅ Server and MongoDB disconnected.");
      process.exit(0);
    });
  });
};

startServer();
