const db = require("../config/db");

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const getAuthorAlias = (value, fallback = "Anonymous User") =>
 normalizeText(value) || fallback;

exports.createpost = async (req, res) => {
 try {
  const title = normalizeText(req.body.title);
  const content = normalizeText(req.body.content);
  const tag = normalizeText(req.body.tag);
  const authorId = Number.parseInt(req.body.userId, 10) || null;
  const authorAlias = getAuthorAlias(req.body.authorAlias);

  if (!title || !content || !tag) {
   return res
    .status(400)
    .json({ message: "Title, content, and tag are required." });
  }

  const [result] = await db.promise().query(
   `INSERT INTO forum_posts (title, content, tag, author_id, author_alias)
    VALUES (?, ?, ?, ?, ?)`,
   [title, content, tag, authorId, authorAlias],
  );

  res.json({
   id: result.insertId,
   title,
   content,
   tag,
   author_alias: authorAlias,
   upvotes: 0,
   downvotes: 0,
   comments: 0,
  });
 } catch (err) {
  console.error("Create Post Error:", err);
  res.status(500).json({ message: "Unable to create the post right now." });
 }
};

exports.getpost = async (req, res) => {
 try {
  const userId = req.query.userId || null;

  const [rows] = await db.promise().query(
   `
   SELECT
    p.*,
    COALESCE(NULLIF(p.author_alias, ''), 'Anonymous User') AS author_alias,
    COUNT(c.id) as comments,
    (SELECT vote_type FROM post_votes pv WHERE pv.post_id = p.id AND pv.user_id = ?) as userVote
   FROM forum_posts p
   LEFT JOIN comments c ON p.id = c.post_id
   GROUP BY p.id
   ORDER BY p.created_at DESC
  `,
   [userId],
  );

  res.json(rows);
 } catch (err) {
  console.error("Get Posts Error:", err);
  res.status(500).json({ message: "Failed to fetch posts" });
 }
};

exports.addreply = async (req, res) => {
 const postId = Number.parseInt(req.body.post_id, 10);
 const parentId = req.body.parent_id ? Number.parseInt(req.body.parent_id, 10) : null;
 const content = normalizeText(req.body.content);
 const authorId = Number.parseInt(req.body.userId, 10) || null;
 const authorAlias = getAuthorAlias(req.body.authorAlias);

 if (!postId || !content) {
  return res
   .status(400)
   .json({ message: "Post ID and comment content are required." });
 }

 try {
  await db.promise().query(
   `INSERT INTO comments (post_id, parent_id, content, author_id, author_alias)
    VALUES (?, ?, ?, ?, ?)`,
   [postId, parentId, content, authorId, authorAlias],
  );

  res.json({ message: "Comment added" });
 } catch (err) {
  console.error("Add Comment Error:", err);
  res.status(500).json({ message: "Unable to add comment right now." });
 }
};

exports.getreply = async (req, res) => {
 try {
  const [rows] = await db.promise().query(
   `
    SELECT
     *,
     COALESCE(NULLIF(author_alias, ''), 'Anonymous User') AS author_alias
    FROM comments
    WHERE post_id = ?
    ORDER BY created_at ASC
   `,
   [req.params.postId],
  );

  res.json(rows);
 } catch (err) {
  console.error("Get Comments Error:", err);
  res.status(500).json({ message: "Unable to load comments right now." });
 }
};

exports.votePost = async (req, res) => {
 try {
  const { postId, upvotes, downvotes, userId, voteType } = req.body;

  if (
   !postId ||
   !userId ||
   upvotes === undefined ||
   downvotes === undefined ||
   !["up", "down"].includes(voteType)
  ) {
   return res.status(400).json({ message: "Missing data" });
  }

  try {
   await db
    .promise()
    .query(
     "INSERT INTO post_votes (post_id, user_id, vote_type) VALUES (?, ?, ?)",
     [postId, String(userId), voteType],
    );
  } catch (dbErr) {
   if (dbErr.code === "ER_DUP_ENTRY") {
    return res
     .status(403)
     .json({ message: "You have already voted on this post." });
   }
   throw dbErr;
  }

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
