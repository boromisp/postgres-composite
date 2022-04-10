# postgres-composite [![tests](https://github.com/boromisp/postgres-composite/workflows/test/badge.svg)](https://github.com/boromisp/postgres-composite/actions?query=workflow%3Atest)

> Parse and serialize postgres composite values

## Install

```
npm install --save postgres-composite

yarn add postgres-composite
```

## Usage

```js
const { parse, serialize } = require('postgres-composite')

[...parse('(1,2,3)')]
// => ['1', '2', '3']

[...parse('(1,," 3")')]
// => ['1', null, ' 3']

[...parse('()')]
// => [null]

serialize(['1', '2', '3'])
// => '(1,2,3)'

serialize(['1', null, ' 3'])
// => '(1,," 3")'
```

## API

#### `parse(value: string): Iterable<string | null>`

The value must match format produced by the Postgres' [composite output routine](https://www.postgresql.org/docs/14/rowtypes.html#ROWTYPES-IO-SYNTAX). The behavior with other formats is undefined.

#### `serialize(attributes: Iterable<string | null>): string`

Throws `RangeError` on empty input.

## License

MIT © [Peter B (@boromisp)](http://github.com/boromisp)
