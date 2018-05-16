var express = require('express');
var graphqlHTTP = require('express-graphql');
var { buildSchema } = require('graphql');
var crypto = require('crypto');

var schema = buildSchema(`
    input MessageInput {
        content: String,
        author: String
    }

    type Message {
        id: ID!,
        content: String,
        author: String
    }

    type RandomDie {
        numSides: Int!,
        rollOnce: Int!,
        roll(numRolls: Int!): [Int]
    }

    type Mutation {
        createMessage(input: MessageInput): Message,
        updateMessage(id: ID!, input: MessageInput): Message
    }

    type Query {
        quoteOfTheDay: String,
        random: Float!,
        rollDice(numDice: Int!, numSides: Int): [Int],
        getDie(numSides: Int): RandomDie,
        getMessage(id: ID!): Message
    }
`);

class RandomDie {
    constructor(numSides) {
        this.numSides = numSides;
    }

    rollOnce() {
        return 1 + Math.floor(Math.random() * this.numSides);
    }

    roll({numRolls}) {
        let output = [];
        for (let i = 0; i < numRolls; i++) {
          output.push(this.rollOnce());
        }
        return output;
    }
};

class Message {
    constructor(id, {content, author}) {
        this.id = id;
        this.content = content;
        this.author = author;
    }
}

var fakeDataBase = {};

var root = {
    quoteOfTheDay: () => {
        return Math.random() < 0.5 ? 'Take it easy' : 'Salvation lies within';
    },
    random: () => {
        return Math.random();
    },
    rollDice: ({numDice, numSides}) => {
        let output = [];
        for (let i = 0; i < numDice; i++) {
            output.push(1 + Math.floor(Math.random() * (numSides || 6)));
        }
        return output;
    },
    getDie: ({numSides}) => {
        return new RandomDie(numSides || 6);
    },
    getMessage: ({id}) => {
        if (!fakeDataBase[id]) {
            throw new Error('no messages exists with id: ' + id);
        }
        return new Message(id, fakeDataBase[id]);
    },
    createMessage: ({input}) => {
        let id = crypto.randomBytes(10).toString('hex');

        fakeDataBase[id] = input;
        return new Message(id, input);
    },
    updateMessage: ({id, input}) => {
        if (!fakeDataBase[id]) {
            throw new Error('no messages exists with id: ' + id);
        }

        fakeDataBase[id] = input;
        return new Message(id, input);
    }
};

var app = express();
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
}));
app.listen(4000);
console.log('Running a GraphQL API server at localhost:4000/graphql');

// Client logic Example:

// var author = 'andy';
// var content = 'hope is a good thing';
// var xhr = new XMLHttpRequest();
// xhr.responseType = 'json';
// xhr.open("POST", "/graphql");
// xhr.setRequestHeader("Content-Type", "application/json");
// xhr.setRequestHeader("Accept", "application/json");
// xhr.onload = function () {
//   console.log('data returned:', xhr.response);
// }
// var query = `mutation CreateMessage($input: MessageInput) {
//   createMessage(input: $input) {
//     id
//   }
// }`;
// xhr.send(JSON.stringify({
//   query: query,
//   variables: {
//     input: {
//       author: author,
//       content: content,
//     }
//   }
// }));