const {AuthenticationError} = require("apollo-server-express");
const {User, Book} = require("../models");
const {signToken} = require("../utils/auth");

const resolvers = {
  Query: {
    // Get a list of all users
    allUsers: async () => {
      try {
        const users = await User.find().populate("savedBooks");
        return users;
      } catch (error) {
        console.error("Error fetching users:", error.message);
        throw new Error("Failed to fetch users");
      }
    },

    // Get a single user by username
    getUser: async (_, {username}) => {
      try {
        const user = await User.findOne({username}).populate("savedBooks");
        return user;
      } catch (error) {
        console.error("Error fetching user by username:", error.message);
        throw new Error("Failed to fetch user");
      }
    },

    // Get a list of all books
    allBooks: async (_, {username}) => {
      try {
        const params = username ? {username} : {};
        const books = await Book.find(params).sort({createdAt: -1});
        return books;
      } catch (error) {
        console.error("Error fetching books:", error.message);
        throw new Error("Failed to fetch books");
      }
    },

    // Get a single book by bookId
    getBook: async (_, {bookId}) => {
      try {
        const book = await Book.findOne({_id: bookId});
        return book;
      } catch (error) {
        console.error("Error fetching book by bookId:", error.message);
        throw new Error("Failed to fetch book");
      }
    },

    // Get the current user (requires authentication)
    me: async (_, __, {user}) => {
      if (!user) {
        throw new AuthenticationError("You need to be logged in!");
      }

      try {
        const currentUser = await User.findOne({_id: user._id}).populate(
          "savedBooks"
        );
        return currentUser;
      } catch (error) {
        console.error("Error fetching user from the database:", error.message);
        throw new Error("Failed to fetch user");
      }
    },
  },

  Mutation: {
    // Create a new user
    createUser: async (_, {username, email, password}) => {
      try {
        const user = await User.create({username, email, password});
        const token = signToken(user);
        return {token, user};
      } catch (error) {
        console.error("Error creating user:", error.message);
        throw new Error("Failed to create user");
      }
    },

    // User login
    loginUser: async (_, {email, password}) => {
      try {
        const user = await User.findOne({email});

        if (!user) {
          throw new AuthenticationError(
            "No user found with this email address"
          );
        }

        const isPasswordCorrect = await user.isCorrectPassword(password);

        if (!isPasswordCorrect) {
          throw new AuthenticationError("Incorrect credentials");
        }

        const token = signToken(user);

        return {token, user};
      } catch (error) {
        console.error("Error during login:", error.message);
        throw new Error("Failed to login");
      }
    },

    // Save a book to the user's collection
    saveBook: async (
      _,
      {authors, description, title, bookId, image, link},
      {user}
    ) => {
      if (!user) {
        throw new AuthenticationError("You need to be logged in!");
      }

      try {
        const book = await Book.create({
          authors,
          description,
          title,
          bookId,
          image,
          link,
        });

        const updatedUser = await User.findOneAndUpdate(
          {_id: user._id},
          {$addToSet: {savedBooks: book._id}},
          {new: true, runValidators: true}
        );

        return updatedUser;
      } catch (error) {
        console.error("Error saving book:", error.message);
        throw new Error("Failed to save book");
      }
    },

    // Remove a book from the user's collection
    removeBook: async (_, {bookId}, {user}) => {
      if (!user) {
        throw new AuthenticationError("You need to be logged in!");
      }

      try {
        const book = await Book.findOneAndDelete({_id: bookId});
        const updatedUser = await User.findOneAndUpdate(
          {_id: user._id},
          {$pull: {savedBooks: bookId}},
          {new: true}
        );

        return book;
      } catch (error) {
        console.error("Error removing book:", error.message);
        throw new Error("Failed to remove book");
      }
    },
  },
};

module.exports = resolvers;
