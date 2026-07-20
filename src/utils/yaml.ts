/**
 * A minimal YAML parser that supports the small subset needed for fleet
 * config files: scalars, inline lists (`[a, b]`), block lists, simple mappings
 * and nested mappings via indentation.
 *
 * For anything more demanding swap this out for the `yaml` package — the
 * public API (`parse`) is intentionally compatible.
 */

type Token =
  | { kind: "scalar"; value: string }
  | { kind: "list"; items: unknown[] }
  | { kind: "map"; entries: [string, unknown][] };

// ---------- Public API ----------

export function parse(input: string): unknown {
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*$/, "").replace(/\s+$/, ""))
    .filter((l) => l.trim() !== "");

  const { value } = parseBlock(lines, 0, getIndent(lines[0] ?? ""));
  return value;
}

// ---------- Internals ----------

function getIndent(line: string): number {
  const m = line.match(/^\s*/);
  return m ? m[0].length : 0;
}

function parseBlock(lines: string[], start: number, indent: number): { value: unknown; next: number } {
  if (start >= lines.length) return { value: null, next: start };

  const firstLine = lines[start];
  if (firstLine.trim().startsWith("- ")) {
    return parseList(lines, start, indent);
  }
  return parseMap(lines, start, indent);
}

function parseMap(lines: string[], start: number, indent: number): { value: Record<string, unknown>; next: number } {
  const result: Record<string, unknown> = {};
  let i = start;

  while (i < lines.length) {
    const line = lines[i];
    const lineIndent = getIndent(line);
    if (lineIndent < indent) break;
    if (lineIndent > indent) {
      i++;
      continue;
    }

    const colonIdx = findColon(line.trim());
    if (colonIdx === -1) {
      i++;
      continue;
    }

    const key = line.trim().slice(0, colonIdx).trim();
    const rest = line.trim().slice(colonIdx + 1).trim();

    if (rest !== "") {
      result[key] = parseScalar(rest);
      i++;
    } else {
      const childIndent = i + 1 < lines.length ? getIndent(lines[i + 1]) : indent;
      if (childIndent <= indent) {
        result[key] = null;
        i++;
      } else {
        const { value: child, next } = parseBlock(lines, i + 1, childIndent);
        result[key] = child;
        i = next;
      }
    }
  }

  return { value: result, next: i };
}

function parseList(lines: string[], start: number, indent: number): { value: unknown[]; next: number } {
  const items: unknown[] = [];
  let i = start;

  while (i < lines.length) {
    const line = lines[i];
    const lineIndent = getIndent(line);
    if (lineIndent < indent) break;

    const trimmed = line.trim();
    if (!trimmed.startsWith("- ")) {
      if (lineIndent === indent) break;
      i++;
      continue;
    }

    const content = trimmed.slice(2).trim();

    if (findColon(content) !== -1 && !content.startsWith('"') && !content.startsWith("'")) {
      const itemObj: Record<string, unknown> = {};
      const [firstKey, ...restParts] = content.split(":");
      const firstVal = restParts.join(":").trim();
      if (firstVal !== "") {
        itemObj[firstKey.trim()] = parseScalar(firstVal);
      }

      const itemIndent = lineIndent + 2;
      i++;

      if (firstVal === "") {
        const childIndent = i < lines.length ? getIndent(lines[i]) : itemIndent;
        if (childIndent > lineIndent) {
          const { value: child, next } = parseBlock(lines, i, childIndent);
          Object.assign(itemObj, child as object);
          i = next;
        }
      }

      while (i < lines.length) {
        const nextLine = lines[i];
        const ni = getIndent(nextLine);
        if (ni < itemIndent) break;
        if (ni === itemIndent && nextLine.trim().startsWith("- ")) break;
        if (ni === indent) break;

        const nc = findColon(nextLine.trim());
        if (nc !== -1) {
          const k = nextLine.trim().slice(0, nc).trim();
          const v = nextLine.trim().slice(nc + 1).trim();
          if (v !== "") {
            itemObj[k] = parseScalar(v);
            i++;
          } else {
            const childIndent = i + 1 < lines.length ? getIndent(lines[i + 1]) : itemIndent;
            if (childIndent > itemIndent) {
              const { value: child, next } = parseBlock(lines, i + 1, childIndent);
              itemObj[k] = child;
              i = next;
            } else {
              itemObj[k] = null;
              i++;
            }
          }
        } else {
          i++;
        }
      }

      items.push(itemObj);
    } else {
      items.push(parseScalar(content));
      i++;
    }
  }

  return { value: items, next: i };
}

function findColon(s: string): number {
  let inQuote: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuote) {
      if (c === inQuote) inQuote = null;
    } else if (c === '"' || c === "'") {
      inQuote = c;
    } else if (c === ":") {
      return i;
    }
  }
  return -1;
}

function parseScalar(raw: string): unknown {
  const v = raw.trim();
  if (v === "") return null;
  if (v === "null" || v === "~") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if (v.startsWith("[") && v.endsWith("]")) {
    return v
      .slice(1, -1)
      .split(",")
      .map((s) => parseScalar(s.trim()) as string)
      .filter((s) => s !== "");
  }
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  return v;
}

// ---------- Serializer (for `fleet init`) ----------

export function stringify(value: unknown, indent = 0): string {
  return serialize(value, indent);
}

function serialize(value: unknown, indent: number): string {
  const pad = "  ".repeat(indent);
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, unknown>;
          const entries = Object.entries(obj);
          if (entries.length === 0) return `${pad}- {}`;
          const [firstKey, firstVal] = entries[0];
          const head = `${pad}- ${firstKey}: ${serializeInline(firstVal, indent + 1)}`;
          const tail = entries
            .slice(1)
            .map(([k, v]) => `${pad}  ${k}: ${serializeInline(v, indent + 1)}`)
            .join("\n");
          return tail ? `${head}\n${tail}` : head;
        }
        return `${pad}- ${serializeInline(item, indent)}`;
      })
      .join("\n");
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    return entries
      .map(([k, v]) => `${pad}${k}: ${serializeInline(v, indent)}`)
      .join("\n");
  }
  return String(value);
}

function serializeInline(value: unknown, indent: number): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return needsQuote(value) ? JSON.stringify(value) : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[${value.map((v) => serializeInline(v, indent)).join(", ")}]`;
  }
  return `\n${serialize(value, indent + 1)}`;
}

function needsQuote(s: string): boolean {
  return /[:#\[\]{}&*!|>'"%@`]/.test(s) || /^\s|\s$/.test(s) || s === "" || s === "true" || s === "false" || s === "null";
}

export default { parse, stringify };
