var express = require('express');
var graphqlHTTP = require('express-graphql');
var { buildSchema } = require('graphql');

var schema = buildSchema(`
    type RandomDie {
        numSides: Int!,
        rollOnce: Int!,
        roll(numRolls: Int!): [Int]
    }

    type Query {
        quoteOfTheDay: String,
        random: Float!,
        rollDice(numDice: Int!, numSides: Int): [Int],
        getDie(numSides: Int): RandomDie
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