const { getDatabase, persist } = require("./local-store");

const matchesOr = (row, expression) => expression.split(",").some(part => {
  const [field, operator, ...raw] = part.split(".");
  const value = raw.join(".");
  if (operator === "eq") return String(row[field]) === value;
  if (operator === "is" && value === "null") return row[field] == null;
  return false;
});

class LocalQuery {
  constructor(table) { this.table = table; this.filters = []; this.operation = "select"; this.payload = null; this.one = null; this.sort = null; this.max = null; }
  select() { return this; }
  eq(field, value) { this.filters.push(row => row[field] === value); return this; }
  neq(field, value) { this.filters.push(row => row[field] !== value); return this; }
  in(field, values) { this.filters.push(row => values.includes(row[field])); return this; }
  is(field, value) { this.filters.push(row => value === null ? row[field] == null : row[field] === value); return this; }
  ilike(field, pattern) { const needle = String(pattern).replaceAll("%", "").toLowerCase(); this.filters.push(row => String(row[field] || "").toLowerCase().includes(needle)); return this; }
  or(expression) { this.filters.push(row => matchesOr(row, expression)); return this; }
  insert(rows) { this.operation = "insert"; this.payload = rows; return this; }
  update(updates) { this.operation = "update"; this.payload = updates; return this; }
  delete() { this.operation = "delete"; return this; }
  single() { this.one = "single"; return this; }
  maybeSingle() { this.one = "maybe"; return this; }
  order(field, { ascending = true } = {}) { this.sort = { field, ascending }; return this; }
  limit(value) { this.max = value; return this; }
  then(resolve, reject) { return this.execute().then(resolve, reject); }
  async execute() {
    const database = getDatabase();
    const table = database[this.table];
    if (!table) return { data: null, error: new Error(`Unknown local table: ${this.table}`) };
    let rows = table.filter(row => this.filters.every(filter => filter(row)));
    if (this.operation === "insert") { rows = this.payload.map(row => ({ ...row, created_at: row.created_at || new Date().toISOString() })); table.push(...rows); persist(); }
    if (this.operation === "update") { rows.forEach(row => Object.assign(row, this.payload)); persist(); }
    if (this.operation === "delete") { for (const row of rows) table.splice(table.indexOf(row), 1); persist(); }
    if (this.sort) rows.sort((a, b) => (a[this.sort.field] > b[this.sort.field] ? 1 : -1) * (this.sort.ascending ? 1 : -1));
    if (this.max != null) rows = rows.slice(0, this.max);
    const data = this.one ? (rows[0] || null) : rows;
    const error = this.one === "single" && !data ? new Error("Row not found") : null;
    return { data, error };
  }
}

module.exports = { from: table => new LocalQuery(table) };
