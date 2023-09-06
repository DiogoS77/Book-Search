const {AuthenticationError} = require("apollo-server-express");
const {User, Book} = require("../models");
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

    saveBook: async (parent, args, context) => {
      if (context.user) {
        const {authors, description, title, bookId, image, link} = args;
        const book = await Book.create({
          authors,
          description,
          title,
          bookId,
          image,
          link,
        });

        const updatedUser = await User.findOneAndUpdate(
          {_id: context.user._id},
          {$addToSet: {savedBooks: book._id}},
          {new: true, runValidators: true}
        );

        return updatedUser;
      }

      throw new AuthenticationError("You need to be logged in");
    },

    removeBook: async (parent, args, context) => {
      if (context.user) {
        const {_id} = args;
        const book = await Book.findOneAndDelete({_id});
        const user = await User.findOneAndUpdate(
          {_id: context.user._id},
          {$pull: {savedBooks: book._id}},
          {new: true}
        );
        return book;
      }

      throw new AuthenticationError("You need to be logged in");
    },
  },
};

module.exports = resolvers;
