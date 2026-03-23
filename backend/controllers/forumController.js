const db = require("../config/db");

// ================= CREATE POST =================
exports.createpost = async (req, res) => {
 try {
  const { title, content, tag } = req.body;

  // 1. Catch the 'result' array from the database query
  const [result] = await db
   .promise()
   .query("INSERT INTO forum_posts (title, content, tag) VALUES (?, ?, ?)", [
    title,
    content,
    tag,
   ]);

  // 2. Send back the newly created post data, including the vital insertId
  res.json({
   id: result.insertId,
   title: title,
   content: content,
   tag: tag,
   upvotes: 0,
   downvotes: 0,
   comments: 0,
  });
 } catch (err) {
  console.error("Create Post Error:", err);
  res.status(500).json(err);
 }
};

// ================= GET POSTS =================
exports.getpost = async (req, res) => {
 try {
  // Grab the userId from the URL query (e.g., ?userId=rupamd23)
  const userId = req.query.userId || null;

  const [rows] = await db.promise().query(
   `
   SELECT 
    p.*, 
    COUNT(c.id) as comments,
    (SELECT vote_type FROM post_votes pv WHERE pv.post_id = p.id AND pv.user_id = ?) as userVote
   FROM forum_posts p 
   LEFT JOIN comments c ON p.id = c.post_id 
   GROUP BY p.id 
   ORDER BY p.created_at DESC
  `,
   [userId],
  ); // Pass the userId to the subquery safely

  res.json(rows);
 } catch (err) {
  console.error("Get Posts Error:", err);
  res.status(500).json({ message: "Failed to fetch posts" });
 }
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
  // We now expect userId and voteType from the frontend
  const { postId, upvotes, downvotes, userId, voteType } = req.body;

  if (!postId || !userId || upvotes === undefined) {
   return res.status(400).json({ message: "Missing data" });
  }

  // 1. Try to record the user's vote in the ledger
  try {
   await db
    .promise()
    .query(
     "INSERT INTO post_votes (post_id, user_id, vote_type) VALUES (?, ?, ?)",
     [postId, userId, voteType],
    );
  } catch (dbErr) {
   // If the user already voted, MySQL blocks it and throws this specific error
   if (dbErr.code === "ER_DUP_ENTRY") {
    return res
     .status(403)
     .json({ message: "You have already voted on this post." });
   }
   throw dbErr; // Pass other errors down to the main catch block
  }

  // 2. If the ledger entry succeeded, update the total numbers on the post
  await db
   .promise()
   .query("UPDATE forum_posts SET upvotes = ?, downvotes = ? WHERE id = ?", [
    upvotes,
    downvotes,
    postId,
   ]);

  res.json({ message: "Vote locked in successfully" });
 } catch (err) {
  console.error("Vote Error:", err);
  res.status(500).json({ message: "Database error" });
 }
};
