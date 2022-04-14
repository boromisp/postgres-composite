const field = String.raw`[^\s(),"\\]*|"(?:[^"\\]|""|\\\\)*"`;
const validator = new RegExp(String.raw`^\((?:${field})(?:,${field})*\)$`);

export function validate(value: string) {
  return validator.test(value);
}

// should match a field separator and a field value, capturing the field value
// should make sure that the string begins and ends with ( and )
const parser = new RegExp(
  String.raw`(?:^\(|(?<!^),)(${field})(?=,(?!$)|\)$)`,
  "g"
);

// Returns empty on null
export function* parse(value: string | null) {
  if (value === null) {
    return;
  }

  if (typeof value !== "string") {
    throw new TypeError("string expected");
  }

  // Need to cache the RegExp lastIndex prop because
  // we are using a stateful object in a generator function.
  let lastIndex = 0;

  do {
    parser.lastIndex = lastIndex;
    const match = parser.exec(value);

    if (!match || match.index > lastIndex) {
      throw new RangeError("invalid value");
    }

    lastIndex = parser.lastIndex;

    if (match[1] === "") {
      yield null;
    } else if (match[1].startsWith('"')) {
      yield match[1]
        .substring(1, match[1].length - 1)
        .replace(/(["\\])\1/g, "$1");
    } else {
      yield match[1];
    }
  } while (lastIndex < value.length - 1);
}

// Returns null on empty input
export function serialize(fields: Iterable<null | string>) {
  let value = "";
  let sep = "(";

  for (const field of fields) {
    value += sep;
    sep = ",";

    switch (field) {
      case null:
        value += "";
        continue;

      case "":
        value += '""';
        continue;

      default:
        if (/[\s(),"\\]/.test(field)) {
          value += `"${field.replace(/(["\\])/g, "$1$1")}"`;
        } else {
          value += field;
        }
    }
  }

  if (sep === "(") {
    return null;
  }

  return value + ")";
}
