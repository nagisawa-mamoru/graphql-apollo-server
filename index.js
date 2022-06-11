const { ApolloServer, gql } = require('apollo-server');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { RESTDataSource } = require('apollo-datasource-rest');
class JsonPlaceAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = 'https://jsonplaceholder.typicode.com/';
  }

  async getUsers() {
    const data = await this.get('/users');
    return data;
  }

  async getUser(id) {
    const data = await this.get(`/users/${id}`);
    return data;
  }

  async getPosts() {
    const data = await this.get('/posts');
    return data;
  }
}

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    myPosts: [Post]
  }

  type Post {
    id: ID!
    title: String!
    body: String!
    userId: ID!
  }

  type Query {
    hello(name: String!): String
    users: [User]
    user(id: ID!): User
    posts: [Post]
  }

  type Mutation {
    createUser(name: String!, email: String!): User
    updateUser(id: Int!, name: String!): User
    deleteUser(id: Int!): User
  }
`;

const resolvers = {
  Query: {
    hello: (a, args) => `Hello ${args.name}`,
    users: async (b, c, { dataSources }) => {
      return prisma.user.findMany();
    },
    user: async (d, args, { dataSources }) => {
      return await dataSources.jsonPlaceAPI.getUser(args.id);
    },
    posts: async (parent, args, { dataSources }) => {
      return await dataSources.jsonPlaceAPI.getPosts();
    }
  },
  Mutation: {
    createUser: (_, args) => {
      return prisma.user.create({
        data: {
          name: args.name,
          email: args.email
        }
      })
    },
    updateUser: (_, args) => {
      return prisma.user.update({
        where: {
          id: args.id,
        },
        data: {
          name: args.name
        }
      })
    },
    deleteUser: (_, args) => {
      return prisma.user.delete({
        where: { id: args.id },
      })
    }
  },
  User: {
    myPosts: async (parent, e, { dataSources }) => {
      console.log("call!!");
      const posts = await dataSources.jsonPlaceAPI.getPosts();
      const myPosts = posts.filter((post) => post.userId == parent.id);
      return myPosts
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers, dataSources: () => {
  return {
    jsonPlaceAPI: new JsonPlaceAPI()
  }
} });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
})