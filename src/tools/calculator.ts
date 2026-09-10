export function calculate(expression: string): number {
  const tokens = tokenize(expression);
  const parser = new Parser(tokens);
  const value = parser.parseExpression();
  parser.expectEnd();
  return Number(value.toPrecision(12));
}

type OperatorValue = "+" | "-" | "*" | "/" | "%" | "^" | "(" | ")";

type Token =
  | { kind: "number"; value: number }
  | { kind: "identifier"; value: string }
  | { kind: "operator"; value: OperatorValue };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let num = "";
      let dotSeen = false;
      while (i < input.length && /[0-9.]/.test(input[i])) {
        if (input[i] === ".") {
          if (dotSeen) throw new Error(`Invalid number at position ${i}`);
          dotSeen = true;
        }
        num += input[i];
        i++;
      }
      const value = Number(num);
      if (Number.isNaN(value)) throw new Error(`Invalid number "${num}"`);
      tokens.push({ kind: "number", value });
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      let id = "";
      while (i < input.length && /[a-zA-Z0-9]/.test(input[i])) {
        id += input[i];
        i++;
      }
      tokens.push({ kind: "identifier", value: id.toLowerCase() });
      continue;
    }
    if (ch === "*") {
      if (input[i + 1] === "*") {
        tokens.push({ kind: "operator", value: "^" });
        i += 2;
      } else {
        tokens.push({ kind: "operator", value: "*" });
        i++;
      }
      continue;
    }

    if ("+-/%^()".includes(ch)) {
      tokens.push({ kind: "operator", value: ch as OperatorValue });
      i++;
      continue;
    }

    throw new Error(`Unexpected character "${ch}" at position ${i}`);
  }

  if (tokens.length === 0) throw new Error("Expression is empty");
  return tokens;
}

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  tau: 2 * Math.PI,
};

const FUNCTIONS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
};

class Parser {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token {
    const token = this.tokens[this.pos];
    if (!token) throw new Error("Unexpected end of expression");
    this.pos++;
    return token;
  }

  private matchOp(value: OperatorValue): boolean {
    const token = this.peek();
    if (token && token.kind === "operator" && token.value === value) {
      this.pos++;
      return true;
    }
    return false;
  }

  parseExpression(): number {
    let value = this.parseTerm();
    for (;;) {
      if (this.matchOp("+")) value += this.parseTerm();
      else if (this.matchOp("-")) value -= this.parseTerm();
      else return value;
    }
  }

  private parseTerm(): number {
    let value = this.parseUnary();
    for (;;) {
      if (this.matchOp("*")) value *= this.parseUnary();
      else if (this.matchOp("/")) {
        const divisor = this.parseUnary();
        if (divisor === 0) throw new Error("Division by zero");
        value /= divisor;
      } else if (this.matchOp("%")) {
        const divisor = this.parseUnary();
        if (divisor === 0) throw new Error("Division by zero");
        value %= divisor;
      } else return value;
    }
  }

  private parseUnary(): number {
    if (this.matchOp("-")) return -this.parseUnary();
    if (this.matchOp("+")) return this.parseUnary();
    return this.parsePower();
  }

  private parsePower(): number {
    const base = this.parsePrimary();
    if (this.matchOp("^")) return Math.pow(base, this.parseUnary());
    return base;
  }

  private parsePrimary(): number {
    const token = this.next();

    if (token.kind === "number") return token.value;

    if (token.kind === "identifier") {
      const name = token.value;
      if (this.matchOp("(")) {
        const arg = this.parseExpression();
        if (!this.matchOp(")")) throw new Error(`Missing ")" after ${name}(...)`);
        const fn = FUNCTIONS[name];
        if (!fn) throw new Error(`Unknown function "${name}"`);
        return fn(arg);
      }
      if (name in CONSTANTS) return CONSTANTS[name];
      throw new Error(`Unknown identifier "${name}"`);
    }

    if (token.kind === "operator" && token.value === "(") {
      const value = this.parseExpression();
      if (!this.matchOp(")")) throw new Error('Missing ")"');
      return value;
    }
    throw new Error(`Unexpected token "${token.value}"`);
  }
  expectEnd(): void {
    const token = this.peek();
    if (token) {
      throw new Error(`Unexpected trailing input near "${token.value}"`);
    }
  }
}
