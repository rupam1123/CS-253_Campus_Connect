const db = require("../config/db");

const REQUIRED_COLUMNS = [
 {
  table: "courses",
  column: "code",
  definition: "VARCHAR(50) NULL AFTER name",
 },
 {
  table: "courses",
  column: "meeting_days",
  definition: "TEXT NULL AFTER code",
 },
 {
  table: "courses",
  column: "start_time",
  definition: "TIME NULL AFTER end_date",
 },
 {
  table: "courses",
  column: "end_time",
  definition: "TIME NULL AFTER start_time",
 },
 {
  table: "course_sessions",
  column: "start_time",
  definition: "TIME NULL AFTER session_date",
 },
 {
  table: "course_sessions",
  column: "end_time",
  definition: "TIME NULL AFTER start_time",
 },
 {
  table: "lectures",
  column: "start_time",
  definition: "TIME NULL AFTER lecture_date",
 },
 {
  table: "lectures",
  column: "end_time",
  definition: "TIME NULL AFTER start_time",
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

async function ensureLiveCommentsTable(connection) {
 await connection.query(`
  CREATE TABLE IF NOT EXISTS lecture_live_comments (
   id INT NOT NULL AUTO_INCREMENT,
   lecture_id INT NOT NULL,
   author_id INT NOT NULL,
   display_name VARCHAR(120) NOT NULL,
   author_role VARCHAR(30) NOT NULL DEFAULT 'student',
   is_anonymous TINYINT(1) NOT NULL DEFAULT 1,
   content TEXT NOT NULL,
   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (id),
   KEY idx_live_comments_lecture (lecture_id),
   KEY idx_live_comments_author_window (author_id, created_at),
   CONSTRAINT lecture_live_comments_ibfk_1
    FOREIGN KEY (lecture_id) REFERENCES lectures (id) ON DELETE CASCADE,
   CONSTRAINT lecture_live_comments_ibfk_2
    FOREIGN KEY (author_id) REFERENCES users (user_id) ON DELETE CASCADE
  )
 `);
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
   "ALTER TABLE course_instructors MODIFY COLUMN role ENUM('primary','co-instructor','ta') NULL",
  );
  await ensureLiveCommentsTable(connection);

  await connection.query(
   "UPDATE courses SET end_time = ADDTIME(start_time, '01:00:00') WHERE start_time IS NOT NULL AND end_time IS NULL",
  );
  await connection.query(
   "UPDATE course_sessions SET end_time = ADDTIME(start_time, '01:00:00') WHERE start_time IS NOT NULL AND end_time IS NULL",
  );
  await connection.query(
   "UPDATE lectures SET end_time = ADDTIME(start_time, '01:00:00') WHERE start_time IS NOT NULL AND end_time IS NULL",
  );

  console.log("Course management schema is ready.");
  process.exit(0);
 } catch (error) {
  console.error("Course management migration failed:", error);
  process.exit(1);
 }
})();
