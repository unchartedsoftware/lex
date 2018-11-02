# Lex.js

> A preact framework for building token-based search bars

For current documentation, please clone the project and run:

```bash
npm install
npm run serve-docs # read the docs
npm run demo # view the demos
```

The following co-requisites must be part of your JS build in order to use Lex:

```js
{
  "preact": "8.x", // developed against: "8.2.7",
  "moment": "2.x", // developed aginst: "2.20.1"
  "flatpickr": "4.5.x" // developed against: "4.5.2"
}
```

The following polyfills are required for use in IE and are not provided by this library:

- Promise Polyfill
