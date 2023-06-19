require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

mongoose.set("strictQuery", false);
mongoose.connect("mongodb+srv://pawelzane:zane@cluster0.tjdj4k0.mongodb.net", {
  useNewUrlParser: true,
});
const db = mongoose.connection;

db.on("error", (error) => console.log(error));
db.once("open", () => console.log("Połączono z bazą"));

app.use(express.json());
app.use(cors());

const users = require("./routes/users");
app.use("/users", users);

const port = process.env.PORT || 8080;

app.listen(port, () => console.log("Listening !"));
