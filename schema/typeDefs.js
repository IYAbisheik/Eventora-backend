const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    token: String
  }

  type Mutation {
    register(email: String!, password: String!): User
    login(email: String!, password: String!): User
  }

  type Query {
    me: User
    users: [User!]!
  }
`;

module.exports = typeDefs;
