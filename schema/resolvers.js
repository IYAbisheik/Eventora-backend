const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { GraphQLUpload } = require("graphql-upload");
const User = require("../modals/User");
const Message = require("../modals/Message");

const generateUsername = (email) => email.split("@")[0] + "_" + Date.now();

const resolvers = {
  Upload: GraphQLUpload,

  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error("Not Authenticated!");
      return await User.findById(user.id);
    },

    users: async () => {
      return await User.find({});
    },

    messages: async (_, { conversationWith }, { user }) => {
      if (!user) throw new Error("Not authenticated");

      const msgs = await Message.find({
        $or: [
          { sender: user.id, receiver: conversationWith },
          { sender: conversationWith, receiver: user.id },
        ],
      })
        .sort({ createdAt: 1 })
        .populate("sender", "id username")
        .populate("receiver", "id username");

      return msgs;
    },
  },

  User: {
    id: (parent) => parent._id.toString(),
  },

  Mutation: {
    register: async (_, { input }) => {
      const { firstname, lastname, username, email, phoneNumber, password, organizer } = input;

      const existingUser = await User.findOne({
        $or: [{ email }, { username }, { phoneNumber }],
      });
      if (existingUser)
        throw new Error("User with this email, username, or phone number already exists");

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        firstname,
        lastname,
        username,
        email,
        phoneNumber,
        password: hashedPassword,
        organizer,
      });

      const savedUser = await newUser.save();

      const token = jwt.sign(
        { id: savedUser._id, email: savedUser.email },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );

      return { token, user: savedUser };
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

      return { token, user };
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
        user = new User({
          email,
          googleId,
          firstname,
          lastname,
          photo,
          username: generateUsername(email),
        });

        await user.save();
      }

      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );

      return { token, user };
    },

    sendMessage: async (_, { toUserId, content }, { user }) => {
      if (!user) throw new Error("Not authenticated");

      // Create message
      const createdMessage = await Message.create({
        sender: user.id,
        receiver: toUserId,
        content,
        createdAt: new Date(),
      });

      // Populate sender and receiver before returning
      const message = await Message.findById(createdMessage._id)
        .populate("sender", "id username")
        .populate("receiver", "id username");

      return message;
    },

    updateUser: async (
      _,
      { firstname, lastname, username, phoneNumber, birthDate, gender },
      { user }
    ) => {
      if (!user) throw new Error("Not authenticated");

      if (username) {
        const existingUsername = await User.findOne({
          username,
          _id: { $ne: user.id },
        });
        if (existingUsername) throw new Error("Username already taken");
      }

      if (phoneNumber) {
        const existingPhone = await User.findOne({
          phoneNumber,
          _id: { $ne: user.id },
        });
        if (existingPhone) throw new Error("Phone number already taken");
      }

      const updateData = {
        firstname,
        lastname,
        username,
        phoneNumber,
        gender,
      };
      if (birthDate) updateData.birthDate = new Date(birthDate);

      const updatedUser = await User.findByIdAndUpdate(user.id, updateData, {
        new: true,
      });

      if (!updatedUser) throw new Error("User not found");

      return updatedUser;
    },

    uploadProfileImage: async (_, { file }, { user }) => {
      if (!user) throw new Error("Not authenticated");

      const { createReadStream, filename } = await file;
      const uploadDir = path.join(__dirname, "../uploads");

      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

      const filePath = path.join(uploadDir, Date.now() + "-" + filename);
      const stream = createReadStream();

      await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath);
        stream.pipe(writeStream);
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });

      const updatedUser = await User.findByIdAndUpdate(
        user.id,
        { photo: `/uploads/${path.basename(filePath)}` },
        { new: true }
      );

      if (!updatedUser) throw new Error("User not found");

      return updatedUser;
    },
  },
};

module.exports = resolvers;
