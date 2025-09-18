const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../modals/User");

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error("Not Authenticated!");
      return await User.findById(user.id);
    },
    users: async () => {
      return await User.find({});
    },
  },

  User: {
    id: (parent) => parent._id.toString(), // map _id to id
  },

  Mutation: {
    register: async (_, { input }) => {
      const { firstname, lastname, username, email, phoneNumber, password } = input;
    
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }, { phoneNumber }] 
      });
      if (existingUser) throw new Error("User with this email, username, or phone number already exists");
    
      const hashedPassword = await bcrypt.hash(password, 10);
    
      const newUser = new User({ firstname, lastname, username, email, phoneNumber, password: hashedPassword });
      const savedUser = await newUser.save();
    
      const token = jwt.sign({ id: savedUser._id, email: savedUser.email }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
    
      return {
        token,
        user: savedUser,
      };
    },

    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found");

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) throw new Error("Invalid password");

      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );

      return {
        id: user._id,
        ...user._doc,
        token,
      };
    },

    googleSignIn: async (_, { input }) => {
      const { email, googleId, firstname, lastname, photo } = input;

      let user = await User.findOne({ email });

      if (user) {
        if (!user.googleId) {
          user.googleId = googleId;
          await user.save();
        }
      } else {
        user = new User({ email, googleId, firstname, lastname, photo });
        await user.save();
      }

      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );

      const { password: pwd, ...userWithoutPassword } = user._doc;
      return { user: userWithoutPassword, token };
    },

    updateUser: async (_, { firstname, lastname, username, phoneNumber, birthDate, gender }, { user }) => {
      if (!user) throw new Error("Not authenticated");
    
      // Check username uniqueness
      if (username) {
        const existingUsername = await User.findOne({ username, _id: { $ne: user.id } });
        if (existingUsername) throw new Error("Username already taken");
      }
    
      // Check phone number uniqueness
      if (phoneNumber) {
        const existingPhone = await User.findOne({ phoneNumber, _id: { $ne: user.id } });
        if (existingPhone) throw new Error("Phone number already taken");
      }
    
      // Convert birthDate string to Date if provided
      const updateData = {
        firstname,
        lastname,
        username,
        phoneNumber,
        gender,
      };
      if (birthDate) updateData.birthDate = new Date(birthDate);
    
      const updatedUser = await User.findByIdAndUpdate(user.id, updateData, { new: true });
    
      if (!updatedUser) throw new Error("User not found");
    
      return updatedUser;
    }
  },
};

module.exports = resolvers;
