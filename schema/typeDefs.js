const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    firstname: String
    lastname: String
    username: String
    phoneNumber: String
    birthDate: String
    gender: String
    token: String
  }

  type Mutation {
    register(email: String!, password: String!): User
    login(email: String!, password: String!): User
    updateUser(
      firstname: String
      lastname: String
      username: String
      phoneNumber: String
      birthDate: String
      gender: String
    ): User
  }

  type Query {
    me: User
    users: [User!]!
  }
`;

module.exports = typeDefs;
