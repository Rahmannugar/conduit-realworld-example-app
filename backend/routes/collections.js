const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authentication");
const {
  addArticle,
  create,
  destroy,
  list,
  removeArticle,
  single,
  update,
} = require("../controllers/collections");

//* Create Collection
router.post("/", verifyToken, create);
//? List own Collections
router.get("/", verifyToken, list);
// Single own Collection with its articles
router.get("/:collectionId", verifyToken, single);
//* Update Collection
router.patch("/:collectionId", verifyToken, update);
//* Delete Collection
router.delete("/:collectionId", verifyToken, destroy);

//> Membership operations
router.post("/:collectionId/articles", verifyToken, addArticle);
router.delete("/:collectionId/articles/:slug", verifyToken, removeArticle);

module.exports = router;
