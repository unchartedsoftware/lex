# Lex.js

> A preact-based micro-framework for building token-based search bars

## Introduction

`Lex` is a micro-framework for building token-based search bars. Rather than predefining how searches are performed, `Lex` provides developers with the tools they need to [define their own query language](###defining-a-search-language), and to [develop unique UI components for constructing queries](###modifying-the-search-ui), thus supporting the widest possible set of potential use cases.

Lex is built internally with [Preact](https://preactjs.com/), ensuring a minimal library size and compatibility with any modern SPA framework (VueJS, Aurelia, React, etc.) by remaining framework-neutral.

## API Documentation and Demos

For current API documentation, please clone the project and run:

```bash
$ npm install
$ npm run serve-docs
```

For demos of key features, refer to source in the `demo` directory, while running:

```bash
$ npm install
$ npm run serve-demos
```

## Using Lex

### Defining a Search Language

> In `Lex`, a **search language** is a finite-state machine. `State`s represent "steps" towards successfully constructing a token through user-supplied values, and users `transition()` between them until they reach a terminal `State` (one with no children).

`Lex` attempts to provide an environment in which developers can craft their own search language, rather than enforcing one. Despite this goal, the following assumptions are made for the sake of improving user experience:

1. A query consists of a list of tokens (i.e. `[TOKEN1  TOKEN2  TOKEN3]`)
1. The set of tokens in a `Lex` bar is interpeted as being joined by either `AND`s or `OR`s (i.e. `[TOKEN1 & TOKEN2 & TOKEN3]`). This connective is not represented visually within the search bar, and thus is left up to the interpretation of the developer (however so far all existing apps using `Lex` have chosen `AND`).
1. Tokens consist of a list of `State`s - effectively, a path through the search language. Each `State` stores one or more values and, together, the sequence represents a statement such as `[Name, is, Sean]`, `[Age, is not, 7]` or `[Location, is, (Toronto,Victoria)]`.
1. Multi-value `State`s can represent an `OR` of values which, together with an overall choice of `AND` connective, strongly encourage [Conjunctive Normal Form](https://en.wikipedia.org/wiki/Conjunctive_normal_form) as the basis for a search language.

Defining a search language in `Lex` is accomplished via method chaining. Let's start with a basic search language, which allows a user to select a column to search and supply a value:

```
Choose Column ----(if string)----> Enter String
              \---(if numeric)---> Enter Number
```

```js
import { Lex, TransitionFactory, ValueState, ValueStateValue, TextEntryState, NumericEntryState } from 'lex';;

const language = Lex.from('columnName', ValueState, {
  name: 'Choose a column to search',
  suggestions: [
    new ValueStateValue('Name', {type: 'string'}),
    new ValueStateValue('Age', {type: 'numeric'})
  ]
}).branch(
  Lex.from('value', TextEntryState, {
    ...TransitionFactory.valueMetaCompare({type: 'string'})
  }),
  Lex.from('value', NumericEntryState, {
    ...TransitionFactory.valueMetaCompare({type: 'numeric'})
  }),
);

const lex = new Lex({
  language: language
  // other options go here
});
lex.render(document.getElementById('LexContainer'));
```

### Modifying the Search UI

TODO

### Consuming Lex Within an Application

The following co-requisites must be part of your JS build in order to use Lex:

```js
{
  "preact": "8.x", // developed against: "8.3.1",
  "moment": "2.x", // developed aginst: "2.22.2"
  "flatpickr": "4.5.x" // developed against: "4.5.2"
}
```

The following polyfills are required for use in IE and are not provided by this library:

- ES6 Promise Polyfill
