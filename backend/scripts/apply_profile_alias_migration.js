const db = require("../config/db");

const REQUIRED_COLUMNS = [
 {
  table: "users",
  column: "anonymous_username",
  definition: "VARCHAR(60) NULL AFTER name",
 },
 {
  table: "forum_posts",
  column: "author_id",
  definition: "INT NULL AFTER tag",
 },
 {
  table: "forum_posts",
  column: "author_alias",
  definition: "VARCHAR(60) NULL AFTER author_id",
 },
 {
  table: "comments",
  column: "author_id",
  definition: "INT NULL AFTER parent_id",
 },
 {
  table: "comments",
  column: "author_alias",
  definition: "VARCHAR(60) NULL AFTER author_id",
 },
];

async function columnExists(connection, table, column) {
 const [rows] = await connection.query(
  `
   SELECT 1
   FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = ?
     AND COLUMN_NAME = ?
   LIMIT 1
  `,
  [table, column],
 );

 return rows.length > 0;
}

(async () => {
 try {
  const connection = db.promise();

  for (const item of REQUIRED_COLUMNS) {
   const exists = await columnExists(connection, item.table, item.column);

   if (!exists) {
    await connection.query(
     `ALTER TABLE ${item.table} ADD COLUMN ${item.column} ${item.definition}`,
    );
   }
  }

  await connection.query(
   "UPDATE users SET anonymous_username = CONCAT('anonymous_', user_id) WHERE anonymous_username IS NULL OR TRIM(anonymous_username) = ''",
  );
  await connection.query(
   `UPDATE forum_posts fp
    LEFT JOIN users u ON fp.author_id = u.user_id
    SET fp.author_alias = COALESCE(NULLIF(fp.author_alias, ''), u.anonymous_username)
    WHERE fp.author_alias IS NULL OR TRIM(fp.author_alias) = ''`,
  );
  await connection.query(
   `UPDATE comments c
    LEFT JOIN users u ON c.author_id = u.user_id
    SET c.author_alias = COALESCE(NULLIF(c.author_alias, ''), u.anonymous_username)
    WHERE c.author_alias IS NULL OR TRIM(c.author_alias) = ''`,
  );

  console.log("Profile and forum alias schema is ready.");
  process.exit(0);
 } catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
 }
})();
