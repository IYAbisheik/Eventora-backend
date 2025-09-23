const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date
  scalar Upload 

  type User {
    id: ID!
    email: String!
    firstname: String
    lastname: String
    username: String
    phoneNumber: String
    birthDate: Date
    gender: String
    photo: String
    organizer: Boolean
  }

  type Message {
    id: ID!
    sender: User!
    receiver: User!
    content: String!
    createdAt: Date!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input RegisterInput {
    email: String!
    password: String
    username: String
    phoneNumber: String
    firstname: String
    lastname: String
    googleId: String
    photo: String
    organizer: Boolean
  }

  input GoogleLoginInput {
    email: String!
    googleId: String!
    firstname: String
    lastname: String
    photo: String
  }

  type Query {
    me: User
    users: [User!]!
    messages(conversationWith: ID!): [Message!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload
    login(email: String!, password: String!): AuthPayload
    googleSignIn(input: GoogleLoginInput!): AuthPayload
    sendMessage(toUserId: ID!, content: String!): Message!
    updateUser(
      firstname: String
      lastname: String
      username: String
      phoneNumber: String
      birthDate: Date
      gender: String
    ): User
    uploadProfileImage(file: Upload!): User!   # ✅ new mutation
  }
`;

module.exports = typeDefs;
