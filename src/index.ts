/**
 * Parses a composite value into the list of attributes.
 * `NULL` attributes are returned as JavaScript `null`, every other value
 * is returned as its string representation.
 *
 * Throws on some invalid inputs.
 *
 * Only supports the output format of the Postgres (see below).
 * In particular, cannot parse and could result in silent errors:
 *  - double quotes escaped by backslash
 *  - backslashes outside of quotes
 *  - anything escaped other then double quotes and backslashes
 *
 * A completely empty field value (no characters at all between the commas or parentheses) represents a NULL.
 * [...] The composite output routine will put double quotes around field values if they are empty strings
 * or contain parentheses, commas, double quotes, backslashes, or white space.
 * (Doing so for white space is not essential, but aids legibility.)
 * Double quotes and backslashes embedded in field values will be doubled.
 *
 * {@link https://www.postgresql.org/docs/current/rowtypes.html#ROWTYPES-IO-SYNTAX Source}
 */
export function* parse(value: string) {
  let i = 0;
  let end;

  // remove leading and trailing whitespace and parentheses
  value = value.trim();
  value = value.substring(1, value.length - 1);

  while (true) {
    switch (value[i]) {
      case undefined:
        yield null;
        return;

      case ",":
        yield null;
        i += 1;
        continue;

      case '"':
        i += 1;
        // find the next double quote not escaped by doubling
        end = i + value.substring(i).search(/(?<=([^"]|^)("")*)"(?!")/);
        if (end < i) {
          throw new RangeError("couldn't find closing double quote");
        }

        yield value
          .substring(i, end)
          .replace(/""/g, '"')
          .replace(/\\\\/g, "\\");

        switch (value[end + 1]) {
          case undefined:
            return;

          case ",":
            i = end + 2;
            continue;

          default:
            throw new RangeError(
              "comma or end-of-string expected after closing double quote"
            );
        }

      default:
        // find the next comma or go to the end of the string
        end = value.indexOf(",", i);
        if (end === -1) {
          yield value.substring(i);
          return;
        }

        yield value.substring(i, end);

        i = end + 1;
        continue;
    }
  }
}

/**
 * Serialze a list of attributes into a composite type literal.
 * `null` values should be passed as is, every other value
 * must be converted to its string representation.
 *
 * Throws on empty input.
 */
export function serialize(attributes: Iterable<null | string>) {
  let value = "(";
  let sep = "";

  for (const attr of attributes) {
    value += sep;
    sep = ",";

    switch (attr) {
      case null:
        continue;

      case "":
        value += '""';
        continue;

      default:
        if (/[,()\\"\s]/.test(attr)) {
          value += `"${attr.replace(/(["\\])/g, "$1$1")}"`;
        } else {
          value += attr;
        }
    }
  }

  if (!sep) {
    throw new RangeError("expected at least one attribute");
  }

  return value + ")";
}
