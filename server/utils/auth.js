const jwt = require("jsonwebtoken");
const {AuthenticationError} = require("apollo-server-express"); // Import relevant modules for Apollo Server

// Set token secret and expiration date
const secret = "mysecretsshhhhh";
const expiration = "2h";

module.exports = {
  // Middleware function for authentication
  authMiddleware: function (context) {
    const req = context.req;

    // Check for the token in the request headers
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split("Bearer ")[1]; // Extract the token from the "Bearer" token format
      console.log({token});
      if (token) {
        try {
          // Verify the token and decode user data
          const {data} = jwt.verify(token, secret, {maxAge: expiration});
          context.user = data; // Store the user data in the context for use in resolvers
        } catch (error) {
          context.user = undefined;
        }
      } else {
        context.user = undefined;
      }
    } else {
      context.user = undefined;
    }
    return context;
  },
  signToken: function ({username, email, _id}) {
    const payload = {username, email, _id};

    return jwt.sign({data: payload}, secret, {expiresIn: expiration});
  },
};
