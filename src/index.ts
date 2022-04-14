function checkEndOfField(value: string, i: number) {
  switch (value[i]) {
    case ",":
      return true;

    case ")":
      if (i < value.length - 1) {
        throw new RangeError(
          "Invalid composite literal: end of input expected"
        );
      }
      return false;

    default:
      throw new RangeError("Invalid composite literal: ) or , expected");
  }
}

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
  if (typeof value !== "string") {
    throw new TypeError("Invalid input: string expected");
  }

  if (value[0] !== "(") {
    throw new RangeError("Invalid composite literal: ( expected");
  }

  let i = 1;
  let end;

  while (true) {
    // expecting a new field
    switch (value[i]) {
      case undefined:
        throw new RangeError(
          "Invalid composite literal: unexpected end of input"
        );

      case ")": // fallthrough
      case ",":
        yield null;

        if (checkEndOfField(value, i)) {
          i += 1;
          continue;
        }
        return;

      case '"':
        i += 1;
        end = i + value.substring(i).search(/(?<=([^"]|^)("")*)"[^"]/);
        if (end < i) {
          throw new RangeError(
            "Invalid composite literal: unterminated double quotes"
          );
        }

        // Should we check if there are odd number of \ before the closing doulbe quotes?
        // Postgres doesn't use \ to escape " in it's output, but accepts it in the input.

        yield value
          .substring(i, end)
          .replace(/""/g, '"')
          .replace(/\\\\/g, "\\");

        if (checkEndOfField(value, end + 1)) {
          i = end + 2;
          continue;
        }
        return;

      default:
        end = value.indexOf(",", i + 1);
        if (end === -1) {
          end = value.indexOf(")", i + 1);
          if (end === -1) {
            throw new RangeError(
              "Invalid composite literal: unexpected end of input"
            );
          }
        }

        // Should we check if there are any \ in the field value?
        // Postgres doesn't use escaped characters in unquoted fields, but accepts it in the input.

        yield value.substring(i, end);

        if (checkEndOfField(value, end)) {
          i = end + 1;
          continue;
        }
        return;
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
