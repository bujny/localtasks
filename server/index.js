const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const {graphqlExpress, graphiqlExpress} = require('apollo-server-express');
const {makeExecutableSchema} = require('graphql-tools');
const cors = require('cors');
const uuidv1 = require('uuid/v1');


// The GraphQL schema in string form
const typeDefs = `
  type Query { getTasks: [Task], getTypes: [Type] }
  type Task { id: String, title: String, type: Type, completed: Boolean, latitude: Float, longitude: Float }
  type Type { id: String, name: String}
  type Mutation { addTask( title: String, typeId: String, latitude: Float, longitude: Float): Task, doTask( id: String ): Task, deleteTask( id: String ) : Task }
`;

// The resolvers
const resolvers = {
    Query: {
        getTasks: () => axios.get(`http://localhost:3000/tasks`).then(resp => resp.data),
        getTypes: () => axios.get(`http://localhost:3000/types`).then(resp => resp.data)
    },
    Task: {
        type: (args) => axios.get(`http://localhost:3000/types/${args.typeId}`).then(resp => resp.data)
    },
    Mutation: {
        addTask: (obj, args, context, info) =>
            axios.post(`http://localhost:3000/tasks`, {
                title: args.title,
                typeId: args.typeId,
                id: uuidv1(),
                completed: false,
                latitude: args.latitude,
                longitude: args.longitude,
            }).then(resp => resp.data),
        doTask: (obj, args, context, info) => axios.get(`http://localhost:3000/tasks/${args.id}`).then(resp =>
        axios.put(`http://localhost:3000/tasks/${args.id}`,{
            completed: !resp.data.completed,
            title: resp.data.title,
            typeId: resp.data.typeId,
            latitude: resp.data.latitude,
            longitude: resp.data.longitude,
        }).then(resp => resp.data)),
        deleteTask: (obj, args, context, info) => axios.delete(`http://localhost:3000/tasks/${args.id}`).then(resp => resp.data)
    }
};

// Put together a schema
const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

// Initialize the app
const app = express();
app.use(cors());

// The GraphQL endpoint
app.use('/graphql', bodyParser.json(), graphqlExpress({schema}));

// GraphiQL, a visual editor for queries
app.use('/graphiql', graphiqlExpress({endpointURL: '/graphql'}));

// Start the server
app.listen(4000, () => {
    console.log('Go to http://localhost:4000/graphiql to run queries!');
});