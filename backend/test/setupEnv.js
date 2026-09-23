const path = require("path");

process.env.NODE_ENV = "test";
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
