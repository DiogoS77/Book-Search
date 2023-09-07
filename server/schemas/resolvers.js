const {AuthenticationError} = require("apollo-server-express");
const {User} = require("../models");
const {signToken} = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({_id: context.user._id}).select(
          "-__v -password"
        );
        return userData;
      }
      throw new AuthenticationError("You are not logged in");
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const {username, email, password} = args;
      const user = await User.create({username, email, password});
      const token = signToken(user);
      return {token, user};
    },

    login: async (parent, {email, password}) => {
      const user = await User.findOne({email});

      if (!user) {
        throw new AuthenticationError("No user found with this email");
      }

      const correctPassword = await user.isCorrectPassword(password);

      if (!correctPassword) {
        throw new AuthenticationError("Incorrect password");
      }

      const token = signToken(user);

      return {token, user};
    },

    saveBook: async (parent, {bookData}, context) => {
      if (context.user) {
        // Find the user by ID and push the new book to their savedBooks array
        const updatedUser = await User.findOneAndUpdate(
          {_id: context.user._id},
          {$push: {savedBooks: bookData}},
          {new: true, runValidators: true}
        );

        return updatedUser;
      }

      throw new AuthenticationError("You need to be logged in");
    },

    removeBook: async (parent, args, context) => {
      if (context.user) {
        const {bookId} = args;
        const user = await User.findOneAndUpdate(
          {_id: context.user._id},
          {$pull: {savedBooks: {bookId}}},
          {new: true}
        );
        return user;
      }

      throw new AuthenticationError("You need to be logged in");
    },
  },
};

module.exports = resolvers;
