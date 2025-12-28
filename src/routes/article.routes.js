const express = require("express");
const router = express.Router();
const controller = require("../controllers/article.controller");

router.post("/", controller.createArticle);
router.get("/", controller.getArticles);
router.get("/:id", controller.getArticleById);
router.delete("/:id", controller.deleteArticle);

module.exports = router;