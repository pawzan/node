const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const cron = require("node-cron");

cron.schedule(
  "00 00 * * *",
  async () => {
    const users = await User.find().lean();

    users.forEach(async (user) => {
      user.favoriteRecipes = [];
      await User.findByIdAndUpdate(user._id, { favoriteRecipes: [] });
    });
  },
  {
    timezone: "Europe/Warsaw",
  }
);

router.post("/register", async (req, res) => {
  console.log(req);
  try {
    if (req.body.password !== req.body.repeat_password) {
      return res.status(400).json({ message: "Hasła nie pasują" });
    }

    const user = new User({
      login: req.body.login,
      password: req.body.password,
      email: req.body.email,
    });

    const savedUser = await user.save();
    res.json({ message: "Pomyślnie zarejestrowno", user: savedUser });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { login, password } = req.body;
  console.log(login + " " + password);
  try {
    const user = await User.findOne({ login });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Niepoprawna nazwa użytkownika lub hasło." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // jeśli hasła się nie zgadzają, zwróć błąd
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Niepoprawna nazwa użytkownika lub hasło." });
    }

    res.json({ message: "Zalogowano pomyślnie.", userId: user._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:userId/caloric-demand", async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.send(user.caloricDemand);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error" });
  }
});

router.post("/caloric-demand/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const { calories, carbs, fat, protein } = req.body;
    const caloricDemand = { calories, carbs, fat, protein };
    console.log(caloricDemand);
    // aktualizuj zapotrzebowanie kaloryczne użytkownika
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { caloricDemand: caloricDemand },
      { new: true }
    );

    // jeśli użytkownik nie istnieje, zwróć błąd
    if (!updatedUser) {
      return res.status(404).json({ message: "Nie znaleziono użytkownika." });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:userId/favorite-recipes", async (req, res) => {
  try {
    const { userId } = req.params;
    const { recipe } = req.body;

    if (!recipe) {
      return res.status(400).json({ message: "Recipe is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { favoriteRecipes: { recipe } } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(201).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:userId/favoriteRecipes", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).populate("favoriteRecipes.recipe");
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.send(user.favoriteRecipes);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error" });
  }
});

router.put("/favorite-recipes/:id/remove", async (req, res) => {
  const userId = req.params.id;
  const recipeIdToRemove = req.body.recipeId;
  console.log(recipeIdToRemove);
  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      {
        $pull: { favoriteRecipes: { "recipe.foodId": recipeIdToRemove } }, //do usuniecia food w apliakcji webwej
      },
      { new: true }
    );
    console.log(updatedUser);

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
