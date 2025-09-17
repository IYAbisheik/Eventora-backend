const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../modals/User");

const resolvers = {
    Query: {
        me: async(_, __, { user }) => {
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
        register: async (_, { email, password }) => {
            const existing = await User.findOne({ email });
            if (existing) throw new Error("User already exists");
      
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({ email, password: hashedPassword });
            await user.save();
      
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
      
            return { id: user._id, email: user.email, token };
        },

        login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found");

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      // spread user but also include token
      return { ...user.toObject(), token };
    }
    },
};

module.exports = resolvers;