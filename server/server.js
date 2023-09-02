const express = require("express");
const path = require("path");
const {ApolloServer} = require("apollo-server-express"); // Import Apollo Server
const {typeDefs, resolvers} = require("./schemas"); // Import your GraphQL schema
const db = require("./config/connection");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({extended: true}));
app.use(express.json());

// If we're in production, serve client/build as static assets
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
}

app.use(routes);

// Define your GraphQL schema and context
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({req}) => ({req}), // Pass the Express request object to context
});

// Apply Apollo Server as middleware
server.applyMiddleware({app});

db.once("open", () => {
  app.listen(PORT, () => console.log(`🌍 Now listening on localhost:${PORT}`));
});
