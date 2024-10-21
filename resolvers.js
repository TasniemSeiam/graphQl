import { userModel } from "./models/user.js";
import { todoModel } from "./models/todo.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const resolvers = {
  Query: {
    async getAllUsers() {
      return await userModel.find({});
    },
    async getUserById(_, { id }) {
      return await userModel.findById(id);
    },
    async getAllTodos() {
      return await todoModel.find({});
    },
    async getTodoById(_, { id }) {
      return await todoModel.findById(id);
    },
    async getTodosByUser(_, { userId }) {
      return await todoModel.find({ user: userId });
    },
  },

  Mutation: {
    async register(_, { user }) {
      const existingUser = await userModel.findOne({ email: user.email });
      if (existingUser) {
        throw new Error("User already exists");
      }
      return await userModel.create(user);
    },
    async login(_, { user }) {
      if (!user.email || !user.password) {
        throw new Error("Please provide email and password");
      }
      const foundUser = await userModel.findOne({ email: user.email });
      if (!foundUser) {
        throw new Error("Invalid email or password");
      }
      const isMatch = await bcrypt.compare(user.password, foundUser.password);
      if (!isMatch) {
        throw new Error("Invalid email or password");
      }
      const token = jwt.sign(
        { id: foundUser._id, role: foundUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      return token;
    },
    async updateUser(_, { id, user }) {
      if (context.user && context.user.role == "admin") {
        return await userModel.findByIdAndUpdate(id, user, { new: true });
      }
      return "Unauthorized  user";
    },
    async deleteUser(_, { id }, context) {
      if (context.user && context.user.role == "admin") {
        await userModel.findByIdAndDelete(id);
        return "User deleted successfully";
      }
      return "Unauthorized to delete user";
    },

    async addTodo(_, { todo, userId }) {
      if (!userId) {
        throw new Error("User ID is required");
      }

      return await todoModel.create({ ...todo, user: userId });
    },
    async updateTodo(_, { id, todo }) {
      return await todoModel.findByIdAndUpdate(id, todo, { new: true });
    },
    async deleteTodo(_, { id }) {
      await todoModel.findByIdAndDelete(id);
      return "Todo deleted successfully";
    },
  },

  User: {
    async todos(parent) {
      return await todoModel.find({ user: parent._id });
    },
  },

  Todo: {
    async user(parent) {
      return await userModel.findById(parent.user);
    },
  },
};
