const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date

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
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload
    login(email: String!, password: String!): AuthPayload
    googleSignIn(input: GoogleLoginInput!): AuthPayload
    updateUser(
      firstname: String
      lastname: String
      username: String
      phoneNumber: String
      birthDate: Date
      gender: String
    ): User
  }
`;

module.exports = typeDefs;
