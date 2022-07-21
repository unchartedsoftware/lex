# Lex.js

> A preact-based micro-framework for building token-based search bars

## Introduction

`Lex` is a micro-framework for building token-based search bars. Rather than predefining how searches are performed, `Lex` provides developers with the tools they need to [define their own query language](###defining-a-search-language), and to [develop unique UI components for constructing queries](###extending-lex), thus supporting the widest possible set of potential use cases.

Lex is built internally with [Preact](https://preactjs.com/), ensuring a minimal library size and compatibility with any modern SPA framework (VueJS, Aurelia, React, etc.) by remaining framework-neutral.

## API Documentation and Demos

### Online

For current API documentation, please visit: https://unchartedsoftware.github.io/lex/

For demos of key features, visit: https://unchartedsoftware.github.io/lex/demo/


### Local
*IMPORTANT*:
Node v14 required for local dev development.
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

Defining a search language in `Lex` is accomplished via method chaining. Let's start with a basic search language, which allows a user to select a column to search and supply a value. The state machine for this language consists of three states, with specific rules governing the transition between the root state and its two children:

```
Choose Column ----(if string)----> Enter String
              \---(if numeric)---> Enter Number
```

Here is the implementation via `Lex`:

```js
import { Lex, TransitionFactory, ValueState, ValueStateValue, TextEntryState, NumericEntryState } from 'lex';;

// Lex.from() starts a subtree of the language
const language = Lex.from('columnName', ValueState, {
  name: 'Choose a column to search',
  suggestions: [
    // ValueStates allow users to choose from a list
    // of values (or potentially create their own).
    // We set metadata "type"s on these options
    // to help us make transition decisions later.
    new ValueStateValue('Name', {type: 'string'}),
    new ValueStateValue('Age', {type: 'numeric'})
  ]
}).branch(
  Lex.from('value', TextEntryState, {
    // transitions to this State are considered legal
    // if the parent State's value had a metadata
    // type === 'string'
    ...TransitionFactory.valueMetaCompare({type: 'string'})
  }),
  Lex.from('value', NumericEntryState, {
    // Similarly, checking for parentVal.meta.type === 'numeric'
    ...TransitionFactory.valueMetaCompare({type: 'numeric'})
  }),
);
```

Consuming the language is as accomplished via configuration when constructing a new instance of `Lex`.

```js
// Now we can instantiate a search bar that will respect this language.
const lex = new Lex({
  language: language
  // other configuration goes here
});
lex.render(document.getElementById('LexContainer'));
```

`Lex` supports far more complex languages, validation rules, state types etc. than are shown in this brief example. Check out the `demo` directory and API documentation for more details.

### Extending Lex

`Lex` translates `State`s from the search language into UI components as a user is creating or modifying a `Token`. These components fall into two categories:

1. **Builders** - UI which is presented inline within a `Token`. This is generally a text input that the user can type into to supply values to the current `State`.
1. **Assistants** - UI which is presented as a drop-down below a `Token`. `Assistant`s provide an alternative, typically richer, mechanism for supplying values to the current `State`.

There must be one `Builder` for each `State` in a search language. `Assistant`s are optional.

`Lex` contains several built-in `State` types, which are associated with default `Builder`s and `Assistant`s:

 State | Default Builder | Default Assistant
------ | --------------- | -----------------
`LabelState` | `LabelBuilder` | none
`ValueState` | `ValueBuilder` | `ValueAssistant`
`RelationState` | `ValueBuilder` | `ValueAssistant`
`TerminalState` | `TerminalBuilder` | none
`TextEntryState` | `ValueBuilder` | `ValueAssistant`
`TextRelationState` | `ValueBuilder` | `ValueAssistant`
`NumericEntryState` | `ValueBuilder` | `ValueAssistant`
`NumericRelationState` | `ValueBuilder` | `ValueAssistant`
`CurrencyEntryState` | `ValueBuilder` | `ValueAssistant`
`DateTimeEntryState` | `DateTimeEntryBuilder` | `DateTimeEntryAssistant`
`DateTimeRelationState` | `ValueBuilder` | `ValueAssistant`

Two things are evident in this table:

1. Most `State` types extend `ValueState`, which is a powerful component supporting selecting a value from a list of suggestions, entering custom values, accepting multiple values, etc.
1. Any `State` type which is missing a direct `Builder` or `Assistant` will attempt to use the corresponding components for its superclass `State`.

`Lex` may be extended, therefore, in the following ways (in descending order of likelihood):

1. Via the implementation of new `State`s, extending existing `State`s (i.e. extending `ValueState` but using `ValueBuilder` and `ValueAssistant`)
1. Via the implementation of new `Assistant`s for existing `State`s (i.e. implementing a custom drop-down UI for choosing dates and times)
1. Via the implementation of new `Builder`s for existing `State`s (mostly for formatting "finished" `Token`s in unique ways by overriding `renderReadOnly()`)
1. Via the implementation of entirely unique `State`s, with custom `Builder`s and `Assistant`s. (i.e. implementing a `GeoBoundsEntryState` with a custom `Builder`, and an `Assistant` featuring a map)

The `State`s, `Builder`s and `Assistant`s within the library are well-documented examples of how these extension types are accomplished, and exist as a reference for this purpose.

Overrides must be registered with `Lex` before the search bar is rendered:

```js
// ...
lex.registerBuilder(DateTimeEntryState, CustomDateTimeEntryBuilder);
lex.registerAssistant(CurrencyEntryState, CustomCurrencyEntryAssistant);
lex.render(document.getElementById('LexContainer'));
```

### Consuming Lex Within an Application

The following co-requisites must be part of your JS build in order to use Lex:

```js
{
  "element-resize-detector": "1.1.x", // developed against "1.1.15"
  "preact": "8.x", // developed against: "8.5.2",
  "moment-timezone": "0.5.x", // developed against "0.5.34"
  "flatpickr": "4.6.x" // developed against: "4.6.3"
}
```

The following polyfills are required for use in IE and are not provided by this library:

- ES6 Promise Polyfill
