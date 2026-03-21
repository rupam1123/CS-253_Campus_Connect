const db = require("../config/db");

// ================= CREATE POST =================
exports.createpost = async (req, res) => {
 try {
  const { title, content, tag } = req.body;

  await db
   .promise()
   .query("INSERT INTO forum_posts (title, content, tag) VALUES (?, ?, ?)", [
    title,
    content,
    tag,
   ]);

  res.json({ message: "Post created" });
 } catch (err) {
  res.status(500).json(err);
 }
};

// ================= GET POSTS =================
exports.getpost = async (req, res) => {
 const [rows] = await db
  .promise()
  .query("SELECT * FROM forum_posts ORDER BY created_at DESC");
 res.json(rows);
};

// ================= ADD COMMENT / REPLY =================
exports.addreply = async (req, res) => {
 const { post_id, parent_id, content } = req.body;

 await db
  .promise()
  .query(
   "INSERT INTO comments (post_id, parent_id, content) VALUES (?, ?, ?)",
   [post_id, parent_id || null, content],
  );

 res.json({ message: "Comment added" });
};

// ================= GET COMMENTS =================
exports.getreply = async (req, res) => {
 const [rows] = await db
  .promise()
  .query("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC", [
   req.params.postId,
  ]);

 res.json(rows);
};

// ================= VOTE POST =================
exports.votePost = async (req, res) => {
 try {
  // Grab the exact calculated numbers we sent from React
  const { postId, upvotes, downvotes } = req.body;

  if (!postId || upvotes === undefined || downvotes === undefined) {
   return res.status(400).json({ message: "Missing data" });
  }

  // Overwrite the database with the correct frontend math
  await db
   .promise()
   .query("UPDATE forum_posts SET upvotes = ?, downvotes = ? WHERE id = ?", [
    upvotes,
    downvotes,
    postId,
   ]);

  res.json({ message: "Vote updated successfully" });
 } catch (err) {
  console.error("Vote Error:", err);
  res.status(500).json({ message: "Database error" });
 }
};
