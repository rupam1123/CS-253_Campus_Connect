const express = require("express");
const {
 createpost,
 getpost,
 addreply,
 getreply,
 votePost,
} = require("../controllers/forumController");

const router = express.Router();

router.post("/create-post", createpost);
router.get("/posts", getpost);
router.post("/add-comment", addreply);
router.get("/comments/:postId", getreply);
router.post("/vote", votePost);

module.exports = router;
