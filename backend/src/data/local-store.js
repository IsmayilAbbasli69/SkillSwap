const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const seedDirectory = path.join(__dirname, "seed");
const dataDirectory = path.join(__dirname, "../../.data");
const databasePath = path.join(dataDirectory, "local-db.json");

const readSeed = name => JSON.parse(fs.readFileSync(path.join(seedDirectory, `${name}.json`), "utf8"));

const buildSeedDatabase = () => ({
  users: [
    { id: "90000000-0000-4000-8000-000000000001", email: "student@skillswap.test", password_hash: bcrypt.hashSync("Password123!", 10) },
    { id: "90000000-0000-4000-8000-000000000002", email: "maya@skillswap.test", password_hash: bcrypt.hashSync("Password123!", 10) },
    { id: "90000000-0000-4000-8000-000000000004", email: "admin@skillswap.test", password_hash: bcrypt.hashSync("Password123!", 10) }
  ],
  institutions: readSeed("institutions"),
  institution_units: readSeed("institution_units"),
  profiles: readSeed("profiles"),
  skills: readSeed("skills"),
  user_skills: readSeed("user_skills"),
  swap_requests: [],
  sessions: [],
  reviews: []
});

const save = database => {
  fs.mkdirSync(dataDirectory, { recursive: true });
  fs.writeFileSync(databasePath, JSON.stringify(database, null, 2));
};

const reset = () => {
  const database = buildSeedDatabase();
  save(database);
  return database;
};

let database;
const getDatabase = () => {
  if (!database) {
    database = fs.existsSync(databasePath)
      ? JSON.parse(fs.readFileSync(databasePath, "utf8"))
      : reset();
  }
  return database;
};

const persist = () => save(getDatabase());

const resetLoadedDatabase = () => {
  database = buildSeedDatabase();
  save(database);
  return database;
};

module.exports = { getDatabase, persist, reset: resetLoadedDatabase, databasePath };
