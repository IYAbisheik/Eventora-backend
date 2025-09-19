const express = require("express");
const { ApolloServer, AuthenticationError } = require("apollo-server-express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const typeDefs = require("./schema/typeDefs");
const resolvers = require("./schema/resolvers");

const startServer = async () => {
  const app = express();
  app.use(cors());

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.replace("Bearer ", "");

      console.log("LINE22", req.headers);

      if (!token) return {};

      try {
        const user = jwt.verify(token, process.env.JWT_SECRET || "secret");
        return { user };
      } catch (err) {
        throw new AuthenticationError("Invalid or expired token");
      }
    },
  });

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected!");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }

  const PORT = process.env.PORT || 4000;
  const serverInstance = app.listen(PORT, () => {
    console.log(
      `[${new Date().toISOString()}] 🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
    );
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
