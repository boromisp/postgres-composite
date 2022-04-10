const { test } = require("tapzero");

const { parse, serialize } = require(".");

test("parse double quotes and nulls", (t) => {
  let result = [...parse('("(""(""""(,)"""")"")")')];
  t.deepEqual(result, ['("(""(,)"")")']);

  result = [...parse(result[0])];
  t.deepEqual(result, ['("(,)")']);

  result = [...parse(result[0])];
  t.deepEqual(result, ["(,)"]);

  result = [...parse(result[0])];
  t.deepEqual(result, [null, null]);

  t.deepEqual([...parse("()")], [null]);
});

test("parse backslashes", (t) => {
  let result = [
    ...parse(
      '("(""(""""(""""""""\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"""""""")"""")"")")'
    ),
  ];
  t.deepEqual(result, ['("(""(""""\\\\\\\\\\\\\\\\"""")"")")']);

  result = [...parse(result[0])];
  t.deepEqual(result, ['("(""\\\\\\\\"")")']);

  result = [...parse(result[0])];
  t.deepEqual(result, ['("\\\\")']);

  result = [...parse(result[0])];
  t.deepEqual(result, ["\\"]);
});

test("serialize throws on empty input", (t) => {
  t.throws(() => serialize([]));
});

test("serialze escapes double quotes and backslashes by doulbling", (t) => {
  t.equal(serialize(['"', "\\"]), '("""","\\\\")');
});

test("serialze quotes commas, whitespaces, parentesis, double quotes and backslashes", (t) => {
  t.equal(serialize(["1", " ", '"', ")", "\\"]), '(1," ","""",")","\\\\")');
});

test("serialze iterable", (t) => {
  t.equal(
    serialize(
      (function* () {
        yield "1";
        yield null;
        yield "3";
      })()
    ),
    "(1,,3)"
  );
});
