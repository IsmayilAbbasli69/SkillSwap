const { reset, databasePath } = require("../src/data/local-store");

reset();
console.log(`Development data reset at ${databasePath}`);
console.log("Accounts: student@skillswap.test, maya@skillswap.test, admin@skillswap.test");
