const db = require("../config/db");

const IITK_EMAIL_REGEX = /^[^\s@]+@iitk\.ac\.in$/i;
const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_TO_INDEX = {
 Sun: 0,
 Mon: 1,
 Tue: 2,
 Wed: 3,
 Thu: 4,
 Fri: 5,
 Sat: 6,
};

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeEmail = (value) => normalizeText(value).toLowerCase();
const normalizeTime = (value) => {
 const rawValue = normalizeText(value);

 if (!rawValue) {
  return "";
 }

 const match = rawValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

 if (!match) {
  return "";
 }

 const [, hour, minute, second = "00"] = match;
 return `${String(Number.parseInt(hour, 10)).padStart(2, "0")}:${minute}:${second}`;
};

const formatTimeLabel = (value) => {
 const normalized = normalizeTime(value);
 return normalized ? normalized.slice(0, 5) : "";
};

const parseMeetingDays = (value) => {
 const source = Array.isArray(value)
  ? value
  : typeof value === "string"
   ? value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
   : [];

 return [...new Set(source)]
  .map((item) => {
   const normalized = normalizeText(item).slice(0, 3).toLowerCase();
   return DAY_ORDER.find((day) => day.toLowerCase() === normalized) || null;
  })
  .filter(Boolean)
  .sort((left, right) => DAY_ORDER.indexOf(left) - DAY_ORDER.indexOf(right));
};

const serializeMeetingDays = (days) => JSON.stringify(parseMeetingDays(days));

const deserializeMeetingDays = (value) => {
 if (!value) {
  return [];
 }

 try {
  const parsed = JSON.parse(value);
  return parseMeetingDays(parsed);
 } catch (error) {
  return parseMeetingDays(value);
 }
};

const formatDate = (date) => {
 const year = date.getFullYear();
 const month = String(date.getMonth() + 1).padStart(2, "0");
 const day = String(date.getDate()).padStart(2, "0");
 return `${year}-${month}-${day}`;
};

const normalizeDateValue = (value) => {
 if (!value) {
  return "";
 }

 if (value instanceof Date) {
  return formatDate(value);
 }

 return normalizeText(String(value)).slice(0, 10);
};

const generateSessionDates = (startDate, endDate, meetingDays) => {
 const activeDayIndexes = meetingDays
  .map((day) => DAY_TO_INDEX[day])
  .filter((dayIndex) => dayIndex !== undefined);

 if (activeDayIndexes.length === 0) {
  return [];
 }

 const start = new Date(`${startDate}T00:00:00`);
 const end = new Date(`${endDate}T00:00:00`);
 const sessions = [];

 for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
  if (activeDayIndexes.includes(cursor.getDay())) {
   sessions.push(formatDate(cursor));
  }
 }

 return sessions;
};

const getNowInIndia = () => {
 const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
 });

 const parts = formatter.formatToParts(new Date());
 const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
 return {
  date: `${values.year}-${values.month}-${values.day}`,
  time: `${values.hour}:${values.minute}:${values.second}`,
 };
};

const buildLectureStatus = (lectureDate, startTime, endTime) => {
 const normalizedLectureDate = normalizeDateValue(lectureDate);
 const now = getNowInIndia();
 const normalizedStartTime = normalizeTime(startTime) || "00:00:00";
 const normalizedEndTime = normalizeTime(endTime) || "23:59:59";
 const isAccessible =
  normalizedLectureDate < now.date ||
  (normalizedLectureDate === now.date && now.time >= normalizedStartTime);

 if (normalizedLectureDate < now.date) {
  return {
   status: "completed",
   isAccessible,
   isInteractionOpen: false,
   startsAt: formatTimeLabel(normalizedStartTime),
   endsAt: formatTimeLabel(normalizedEndTime),
  };
 }

 if (normalizedLectureDate > now.date) {
  return {
   status: "upcoming",
   isAccessible,
   isInteractionOpen: false,
   startsAt: formatTimeLabel(normalizedStartTime),
   endsAt: formatTimeLabel(normalizedEndTime),
  };
 }

 if (now.time < normalizedStartTime) {
  return {
   status: "upcoming",
   isAccessible,
   isInteractionOpen: false,
   startsAt: formatTimeLabel(normalizedStartTime),
   endsAt: formatTimeLabel(normalizedEndTime),
  };
 }

 if (now.time >= normalizedEndTime) {
  return {
   status: "completed",
   isAccessible,
   isInteractionOpen: false,
   startsAt: formatTimeLabel(normalizedStartTime),
   endsAt: formatTimeLabel(normalizedEndTime),
  };
 }

 return {
  status: "live",
  isAccessible,
  isInteractionOpen: true,
  startsAt: formatTimeLabel(normalizedStartTime),
  endsAt: formatTimeLabel(normalizedEndTime),
 };
};

const ensureProfessor = async (connection, userId) => {
 const [rows] = await connection.query(
  "SELECT user_id, role FROM users WHERE user_id = ? LIMIT 1",
  [userId],
 );

 if (rows.length === 0 || rows[0].role !== "professor") {
  return null;
 }

 return rows[0];
};

const getManagedCourseIds = async (connection, userId) => {
 const [rows] = await connection.query(
  `
   SELECT DISTINCT c.id
   FROM courses c
   LEFT JOIN course_instructors ci ON ci.course_id = c.id
   WHERE c.primary_professor_id = ? OR ci.user_id = ?
  `,
  [userId, userId],
 );

 return rows.map((row) => row.id);
};

const canManageCourse = async (connection, courseId, userId) => {
 const [rows] = await connection.query(
  `
   SELECT c.id
   FROM courses c
   LEFT JOIN course_instructors ci ON ci.course_id = c.id
   WHERE c.id = ?
     AND (c.primary_professor_id = ? OR ci.user_id = ?)
   LIMIT 1
  `,
  [courseId, userId, userId],
 );

 return rows.length > 0;
};

const mapCourseRow = (row) => ({
 id: row.id,
 name: row.name,
 code: row.code || "",
 meetingDays: deserializeMeetingDays(row.meeting_days),
 startDate: normalizeDateValue(row.start_date),
 endDate: normalizeDateValue(row.end_date),
 startTime: formatTimeLabel(row.start_time),
 endTime: formatTimeLabel(row.end_time),
 primaryProfessorId: row.primary_professor_id,
 lectureCount: row.lecture_count || 0,
 studentCount: row.student_count || 0,
 staffCount: row.staff_count || 0,
});

const formatRoleLabel = (role) => {
 switch (role) {
  case "professor":
   return "Professor";
  case "co-instructor":
   return "Co-Instructor";
  case "ta":
   return "TA";
  default:
   return "Student";
 }
};

const mapCommentRow = (row) => ({
 id: row.id,
 authorId: row.author_id,
 displayName: row.display_name,
 authorRole: row.author_role,
 roleLabel: formatRoleLabel(row.author_role),
 isAnonymous: Boolean(row.is_anonymous),
 isStaff: row.author_role !== "student",
 content: row.content,
 createdAt: row.created_at,
});

const mapCommentForViewer = (comment, accessType) => {
 if (!comment) {
  return comment;
 }

 if (comment.isStaff) {
  return {
   ...comment,
   viewerLabel: comment.displayName,
  };
 }

 return {
  ...comment,
  viewerLabel: `@${comment.displayName}`,
 };
};

const mapFeedbackEntryForViewer = (entry, accessType) => {
 return {
  ...entry,
  viewerLabel: entry.alias ? `@${entry.alias}` : "Anonymous student",
 };
};

const roundAverage = (value) => {
 const parsed = Number.parseFloat(value);
 return Number.isFinite(parsed) ? Number(parsed.toFixed(1)) : 0;
};

const getLectureFeedbackSummary = async (connection, lectureId) => {
 const [rows] = await connection.query(
  `
   SELECT
    COUNT(*) AS rating_count,
    AVG(overall) AS overall_avg,
    AVG(clarity) AS clarity_avg,
    AVG(pace) AS pace_avg,
    AVG(engagement) AS engagement_avg,
    AVG(content_quality) AS content_quality_avg
   FROM lecture_feedback
   WHERE lecture_id = ?
  `,
  [lectureId],
 );

 return {
  ratingCount: rows[0]?.rating_count || 0,
  averages: {
   overall: roundAverage(rows[0]?.overall_avg),
   clarity: roundAverage(rows[0]?.clarity_avg),
   pace: roundAverage(rows[0]?.pace_avg),
   engagement: roundAverage(rows[0]?.engagement_avg),
   contentQuality: roundAverage(rows[0]?.content_quality_avg),
  },
 };
};

const getLectureRatingEntries = async (connection, lectureId) => {
 const [rows] = await connection.query(
  `
   SELECT
    id,
    alias,
    clarity,
    pace,
    engagement,
    content_quality,
    overall,
    submitted_at
   FROM lecture_feedback
   WHERE lecture_id = ?
   ORDER BY submitted_at DESC
  `,
  [lectureId],
 );

 return rows.map((row) => ({
  id: row.id,
  alias: row.alias,
  clarity: row.clarity,
  pace: row.pace,
  engagement: row.engagement,
  contentQuality: row.content_quality,
  overall: row.overall,
  submittedAt: row.submitted_at,
 }));
};

const getLectureLiveComments = async (connection, lectureId) => {
 const [rows] = await connection.query(
  `
   SELECT
    id,
    lecture_id,
    author_id,
    display_name,
    author_role,
    is_anonymous,
    content,
    created_at
   FROM lecture_live_comments
   WHERE lecture_id = ?
   ORDER BY created_at ASC, id ASC
  `,
  [lectureId],
 );

 return rows.map(mapCommentRow);
};

const getManagedRole = async (connection, courseId, userId) => {
 const [courseRows] = await connection.query(
  "SELECT primary_professor_id FROM courses WHERE id = ? LIMIT 1",
  [courseId],
 );

 if (courseRows.length === 0) {
  return null;
 }

 if (courseRows[0].primary_professor_id === userId) {
  return "professor";
 }

 const [staffRows] = await connection.query(
  "SELECT role FROM course_instructors WHERE course_id = ? AND user_id = ? LIMIT 1",
  [courseId, userId],
 );

 return staffRows[0]?.role || null;
};

const getStudentCourseMembership = async (connection, courseId, userId) => {
 const [rows] = await connection.query(
  `
   SELECT
    ce.student_id,
    u.name,
    COALESCE(
     NULLIF(sca.alias, ''),
     NULLIF(u.anonymous_username, ''),
     CONCAT('anonymous_', u.user_id)
    ) AS alias
   FROM course_enrollments ce
   INNER JOIN users u ON u.user_id = ce.student_id
   LEFT JOIN student_course_aliases sca
     ON sca.course_id = ce.course_id AND sca.student_id = ce.student_id
   WHERE ce.course_id = ? AND ce.student_id = ?
   LIMIT 1
  `,
  [courseId, userId],
 );

 return rows[0] || null;
};

const getCourseAccessContext = async (connection, courseId, userId) => {
 const [userRows] = await connection.query(
  "SELECT user_id, name, role FROM users WHERE user_id = ? LIMIT 1",
  [userId],
 );

 if (userRows.length === 0) {
  return null;
 }

 const user = userRows[0];
 const managedRole = await getManagedRole(connection, courseId, userId);

 if (managedRole) {
  return {
   userId,
   accessType: "staff",
   authorRole: managedRole,
   displayName: user.name,
   isAnonymous: false,
   canRate: false,
  };
 }

 if (user.role === "student") {
  const membership = await getStudentCourseMembership(connection, courseId, userId);

  if (!membership) {
   return null;
  }

  return {
   userId,
   accessType: "student",
   authorRole: "student",
   displayName: membership.alias,
   legalName: membership.name,
   isAnonymous: true,
   canRate: true,
  };
 }

 return null;
};

const getLectureRow = async (connection, courseId, lectureId) => {
 const [lectureRows] = await connection.query(
  `
   SELECT
    l.id,
    l.course_id,
    l.title,
    l.lecture_date,
    l.lecture_number,
    l.start_time,
    l.end_time,
    c.name AS course_name,
    c.code AS course_code
   FROM lectures l
   INNER JOIN courses c ON c.id = l.course_id
   WHERE l.id = ? AND l.course_id = ?
   LIMIT 1
  `,
  [lectureId, courseId],
 );

 return lectureRows[0] || null;
};

const buildLecturePayload = (lectureRow) => {
 const lectureState = buildLectureStatus(
  lectureRow.lecture_date,
  lectureRow.start_time,
  lectureRow.end_time,
 );

 return {
  id: lectureRow.id,
  title: lectureRow.title,
  lectureDate: normalizeDateValue(lectureRow.lecture_date),
  lectureNumber: lectureRow.lecture_number,
  startTime: lectureState.startsAt,
  endTime: lectureState.endsAt,
  status: lectureState.status,
  isAccessible: lectureState.isAccessible,
  isInteractionOpen: lectureState.isInteractionOpen,
  courseId: lectureRow.course_id,
  courseName: lectureRow.course_name,
  courseCode: lectureRow.course_code || "",
 };
};

const getStudentCourses = async (req, res) => {
 const { userId } = req.params;

 try {
  const [rows] = await db.promise().query(
   `
    SELECT c.name
    FROM course_enrollments ce
    INNER JOIN courses c ON c.id = ce.course_id
    WHERE ce.student_id = ?
    ORDER BY c.start_date DESC, c.name ASC
   `,
   [userId],
  );

  const courses = rows
   .map((row) => normalizeText(row.name))
   .filter(Boolean);

  res.status(200).json({ courses });
 } catch (error) {
  console.error("Error fetching courses:", error);
  res.status(500).json({ message: "Server error while fetching courses" });
 }
};

const getStudentCourseTimeline = async (req, res) => {
 const userId = Number.parseInt(req.user?.id, 10);
 const connection = db.promise();

 if (!userId) {
  return res.status(401).json({ message: "Authorization required." });
 }

 try {
  const [courseRows] = await connection.query(
   `
    SELECT
     c.*
    FROM course_enrollments ce
    INNER JOIN courses c ON c.id = ce.course_id
    WHERE ce.student_id = ?
    ORDER BY c.start_date DESC, c.name ASC
   `,
   [userId],
  );

  if (courseRows.length === 0) {
   return res.json({ courses: [] });
  }

  const courseIds = courseRows.map((row) => row.id);
  const placeholders = courseIds.map(() => "?").join(",");

  const [lectureRows] = await connection.query(
   `
    SELECT
     l.id,
     l.course_id,
     l.title,
     l.lecture_date,
     l.lecture_number,
     l.start_time,
     l.end_time,
     lf.id AS feedback_id
    FROM lectures l
    LEFT JOIN lecture_feedback lf
      ON lf.lecture_id = l.id AND lf.student_id = ?
    WHERE l.course_id IN (${placeholders})
    ORDER BY l.lecture_date ASC, l.lecture_number ASC
   `,
   [userId, ...courseIds],
  );

  const lecturesByCourse = new Map();

  for (const row of lectureRows) {
   const lectureState = buildLectureStatus(
    row.lecture_date,
    row.start_time,
    row.end_time,
   );
   const lecture = {
    id: row.id,
    title: row.title,
    lectureNumber: row.lecture_number,
    lectureDate: normalizeDateValue(row.lecture_date),
    startTime: lectureState.startsAt,
    endTime: lectureState.endsAt,
    status: lectureState.status,
    isAccessible: lectureState.isAccessible,
    isInteractionOpen: lectureState.isInteractionOpen,
    hasSubmittedRating: Boolean(row.feedback_id),
   };

   if (!lecturesByCourse.has(row.course_id)) {
    lecturesByCourse.set(row.course_id, []);
   }

   lecturesByCourse.get(row.course_id).push(lecture);
  }

  const courses = courseRows.map((row) => {
   const lectures = lecturesByCourse.get(row.id) || [];

   return {
    ...mapCourseRow(row),
    lectures,
    liveLectureCount: lectures.filter((lecture) => lecture.status === "live").length,
    pendingRatingsCount: lectures.filter(
     (lecture) => lecture.status === "live" && !lecture.hasSubmittedRating,
    ).length,
   };
  });

  res.json({ courses });
 } catch (error) {
  console.error("Error loading student course timeline:", error);
  res.status(500).json({ message: "Unable to load your course timeline." });
 }
};

const getLectureLiveHub = async (req, res) => {
 const courseId = Number.parseInt(req.params.courseId, 10);
 const lectureId = Number.parseInt(req.params.lectureId, 10);
 const userId = Number.parseInt(req.user?.id, 10);
 const connection = db.promise();

 if (!courseId || !lectureId || !userId) {
  return res.status(400).json({ message: "Invalid lecture request." });
 }

 try {
  const access = await getCourseAccessContext(connection, courseId, userId);

  if (!access) {
   return res.status(403).json({ message: "You do not have access to this lecture." });
  }

  const lectureRow = await getLectureRow(connection, courseId, lectureId);

  if (!lectureRow) {
   return res.status(404).json({ message: "Lecture not found." });
  }

  const lecture = buildLecturePayload(lectureRow);

  if (!lecture.isAccessible) {
   return res.status(403).json({
    message: "Live feedback becomes available when the lecture starts.",
   });
  }

  const [comments, feedbackSummary, feedbackEntries, myFeedbackRows] = await Promise.all([
   getLectureLiveComments(connection, lectureId),
   getLectureFeedbackSummary(connection, lectureId),
   getLectureRatingEntries(connection, lectureId),
   access.accessType === "student"
    ? connection.query(
       `
        SELECT
         id,
         alias,
         clarity,
         pace,
         engagement,
         content_quality,
         overall,
         submitted_at
        FROM lecture_feedback
        WHERE lecture_id = ? AND student_id = ?
        LIMIT 1
       `,
       [lectureId, userId],
      )
    : Promise.resolve([[]]),
  ]);

  const myFeedbackRow = myFeedbackRows?.[0]?.[0] || null;
  const visibleComments = comments.map((comment) =>
   mapCommentForViewer(comment, access.accessType),
  );
  const visibleFeedbackEntries = feedbackEntries.map((entry) =>
   mapFeedbackEntryForViewer(entry, access.accessType),
  );

 res.json({
  lecture,
  viewer: {
   id: userId,
   accessType: access.accessType,
   displayName: access.displayName,
   authorRole: access.authorRole,
   roleLabel: formatRoleLabel(access.authorRole),
   isAnonymous: access.isAnonymous,
    canRate: access.canRate && lecture.isInteractionOpen && !myFeedbackRow,
    canComment: lecture.isInteractionOpen,
   },
   comments: visibleComments,
   feedbackSummary,
   feedbackEntries: visibleFeedbackEntries,
   myFeedback: myFeedbackRow
    ? {
       id: myFeedbackRow.id,
       alias: myFeedbackRow.alias,
       clarity: myFeedbackRow.clarity,
       pace: myFeedbackRow.pace,
       engagement: myFeedbackRow.engagement,
       contentQuality: myFeedbackRow.content_quality,
       overall: myFeedbackRow.overall,
       submittedAt: myFeedbackRow.submitted_at,
      }
    : null,
  });
 } catch (error) {
  console.error("Error loading lecture live hub:", error);
  res.status(500).json({ message: "Unable to load live feedback right now." });
 }
};

const postLectureLiveComment = async (req, res) => {
 const courseId = Number.parseInt(req.params.courseId, 10);
 const lectureId = Number.parseInt(req.params.lectureId, 10);
 const userId = Number.parseInt(req.user?.id, 10);
 const content = normalizeText(req.body.content);
 const connection = db.promise();

 if (!courseId || !lectureId || !userId || !content) {
  return res.status(400).json({ message: "Comment content is required." });
 }

 if (content.length > 600) {
  return res.status(400).json({ message: "Keep live comments under 600 characters." });
 }

 try {
  const access = await getCourseAccessContext(connection, courseId, userId);

  if (!access) {
   return res.status(403).json({ message: "You do not have access to this lecture." });
  }

  const lectureRow = await getLectureRow(connection, courseId, lectureId);

  if (!lectureRow) {
   return res.status(404).json({ message: "Lecture not found." });
  }

  const lecture = buildLecturePayload(lectureRow);

  if (!lecture.isInteractionOpen) {
   return res.status(403).json({
    message: "Live comments are open only during the lecture time window.",
   });
  }

  if (access.accessType === "student") {
   const [limitRows] = await connection.query(
    `
     SELECT COUNT(*) AS comment_count
     FROM lecture_live_comments
     WHERE lecture_id = ?
       AND author_id = ?
       AND created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    `,
    [lectureId, userId],
   );

   if ((limitRows[0]?.comment_count || 0) >= 10) {
    return res.status(429).json({
     message: "You have reached the limit of 10 live comments in 5 minutes.",
    });
   }
  }

  const [result] = await connection.query(
   `
    INSERT INTO lecture_live_comments
     (lecture_id, author_id, display_name, author_role, is_anonymous, content)
    VALUES (?, ?, ?, ?, ?, ?)
   `,
   [
    lectureId,
    userId,
    access.displayName,
    access.authorRole,
    access.isAnonymous ? 1 : 0,
    content,
   ],
  );

  const [rows] = await connection.query(
   `
    SELECT
     id,
     lecture_id,
     author_id,
     display_name,
     author_role,
     is_anonymous,
     content,
     created_at
    FROM lecture_live_comments
    WHERE id = ?
    LIMIT 1
   `,
   [result.insertId],
  );

  res.status(201).json({
   comment: mapCommentForViewer(mapCommentRow(rows[0]), access.accessType),
  });
 } catch (error) {
  console.error("Error posting live comment:", error);
  res.status(500).json({ message: "Unable to post that live comment." });
 }
};

const submitLectureRating = async (req, res) => {
 const courseId = Number.parseInt(req.params.courseId, 10);
 const lectureId = Number.parseInt(req.params.lectureId, 10);
 const userId = Number.parseInt(req.user?.id, 10);
 const clarity = Number.parseInt(req.body.clarity, 10);
 const pace = Number.parseInt(req.body.pace, 10);
 const engagement = Number.parseInt(req.body.engagement, 10);
 const contentQuality = Number.parseInt(req.body.contentQuality, 10);
 const overall = Number.parseInt(req.body.overall, 10);
 const connection = db.promise();
 const numericRatings = [
  clarity,
  pace,
  engagement,
  contentQuality,
  overall,
 ];

 if (!courseId || !lectureId || !userId) {
  return res.status(400).json({ message: "Invalid lecture feedback request." });
 }

 if (numericRatings.some((value) => Number.isNaN(value) || value < 1 || value > 5)) {
  return res.status(400).json({ message: "Every rating must be between 1 and 5." });
 }

 try {
  const access = await getCourseAccessContext(connection, courseId, userId);

  if (!access || access.accessType !== "student") {
   return res.status(403).json({
    message: "Only enrolled students can submit lecture ratings.",
   });
  }

  const lectureRow = await getLectureRow(connection, courseId, lectureId);

  if (!lectureRow) {
   return res.status(404).json({ message: "Lecture not found." });
  }

  const lecture = buildLecturePayload(lectureRow);

  if (!lecture.isInteractionOpen) {
   return res.status(403).json({
    message: "Lecture ratings are open only during the live session.",
   });
  }

  await connection.query(
   `
    INSERT INTO lecture_feedback
     (lecture_id, student_id, alias, clarity, pace, engagement, content_quality, overall, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
   `,
   [
    lectureId,
    userId,
    access.displayName,
    clarity,
    pace,
    engagement,
    contentQuality,
    overall,
   ],
  );

  const feedbackSummary = await getLectureFeedbackSummary(connection, lectureId);

  res.status(201).json({
   message: "Live lecture rating submitted successfully.",
   feedbackSummary,
  });
 } catch (error) {
  if (error.code === "ER_DUP_ENTRY") {
   return res.status(409).json({
    message: "You have already submitted your rating for this lecture.",
   });
  }

  console.error("Error submitting lecture rating:", error);
  res.status(500).json({ message: "Unable to submit lecture rating right now." });
 }
};

const getProfessorManagedCourses = async (req, res) => {
 const userId = Number.parseInt(req.user?.id, 10);
 const connection = db.promise();

 try {
  const professor = await ensureProfessor(connection, userId);

  if (!professor) {
   return res.status(403).json({ message: "Professor access required." });
  }

  const [rows] = await connection.query(
   `
    SELECT
     c.*,
     COUNT(DISTINCT l.id) AS lecture_count,
     COUNT(DISTINCT ce.student_id) AS student_count,
     COUNT(DISTINCT ci.user_id) AS staff_count
    FROM courses c
    LEFT JOIN course_instructors ci ON ci.course_id = c.id
    LEFT JOIN course_enrollments ce ON ce.course_id = c.id
    LEFT JOIN lectures l ON l.course_id = c.id
    WHERE c.primary_professor_id = ? OR ci.user_id = ?
    GROUP BY c.id
    ORDER BY c.start_date DESC, c.name ASC
   `,
   [userId, userId],
  );

  res.json({ courses: rows.map(mapCourseRow) });
 } catch (error) {
  console.error("Error fetching managed courses:", error);
  res.status(500).json({ message: "Unable to load professor courses." });
 }
};

const getProfessorCourseDetail = async (req, res) => {
 const courseId = Number.parseInt(req.params.courseId, 10);
 const userId = Number.parseInt(req.user?.id, 10);
 const connection = db.promise();

 if (!courseId) {
  return res.status(400).json({ message: "Invalid course id." });
 }

 try {
  const allowed = await canManageCourse(connection, courseId, userId);

  if (!allowed) {
   return res.status(403).json({ message: "You do not manage this course." });
  }

  const [courseRows] = await connection.query(
   "SELECT * FROM courses WHERE id = ? LIMIT 1",
   [courseId],
  );

  if (courseRows.length === 0) {
   return res.status(404).json({ message: "Course not found." });
  }

  const [staffRows] = await connection.query(
   `
    SELECT
     ci.user_id,
     ci.role,
     u.name,
     u.email,
     u.anonymous_username
    FROM course_instructors ci
    INNER JOIN users u ON u.user_id = ci.user_id
    WHERE ci.course_id = ?
    ORDER BY FIELD(ci.role, 'primary', 'co-instructor', 'ta'), u.name ASC
   `,
   [courseId],
  );

  const [studentRows] = await connection.query(
   `
    SELECT
     ce.student_id,
     u.name,
     u.email
    FROM course_enrollments ce
    INNER JOIN users u ON u.user_id = ce.student_id
    WHERE ce.course_id = ?
    ORDER BY u.name ASC
   `,
   [courseId],
  );

  const [lectureRows] = await connection.query(
   `
    SELECT
     id,
     title,
     lecture_number,
     lecture_date,
     start_time,
     end_time
    FROM lectures
    WHERE course_id = ?
    ORDER BY lecture_date ASC, lecture_number ASC
   `,
   [courseId],
  );

  const lectures = lectureRows.map((row) => {
   const lectureState = buildLectureStatus(
    row.lecture_date,
    row.start_time,
    row.end_time,
   );

   return {
    id: row.id,
    title: row.title,
    lectureNumber: row.lecture_number,
    lectureDate: normalizeDateValue(row.lecture_date),
    startTime: lectureState.startsAt,
    endTime: lectureState.endsAt,
    status: lectureState.status,
    isAccessible: lectureState.isAccessible,
    isInteractionOpen: lectureState.isInteractionOpen,
   };
  });

  res.json({
   course: mapCourseRow({
    ...courseRows[0],
    lecture_count: lectures.length,
    student_count: studentRows.length,
    staff_count: staffRows.length,
   }),
   staff: staffRows.map((row) => ({
    userId: row.user_id,
    role: row.role,
    name: row.name,
    email: row.email,
    anonymousUsername: row.anonymous_username || `anonymous_${row.user_id}`,
   })),
   students: studentRows.map((row) => ({
    userId: row.student_id,
    name: row.name,
    email: row.email,
   })),
   lectures,
  });
 } catch (error) {
  console.error("Error fetching course detail:", error);
  res.status(500).json({ message: "Unable to load course details." });
 }
};

const createProfessorCourse = async (req, res) => {
 const userId = Number.parseInt(req.user?.id, 10);
 const courseName = normalizeText(req.body.courseName);
 const code = normalizeText(req.body.code).toUpperCase();
 const meetingDays = parseMeetingDays(req.body.daysInWeek);
 const startTime = normalizeTime(req.body.startTime);
 const endTime = normalizeTime(req.body.endTime);
 const startDate = normalizeText(req.body.startDate);
 const endDate = normalizeText(req.body.endDate);
 const connection = db.promise();
 let transactionStarted = false;

 if (
  !courseName ||
  !code ||
  !startTime ||
  !endTime ||
  !startDate ||
  !endDate ||
  meetingDays.length === 0
 ) {
  return res.status(400).json({
   message:
    "Course name, code, meeting days, start time, end time, start date, and end date are required.",
  });
 }

 if (endDate < startDate) {
  return res.status(400).json({
   message: "Course end date must be after the start date.",
  });
 }

 if (endTime <= startTime) {
  return res.status(400).json({
   message: "Class end time must be later than the start time.",
  });
 }

 const sessionDates = generateSessionDates(startDate, endDate, meetingDays);

 if (sessionDates.length === 0) {
  return res.status(400).json({
   message: "No lecture dates were generated from that schedule.",
  });
 }

 try {
  const professor = await ensureProfessor(connection, userId);

  if (!professor) {
   return res.status(403).json({ message: "Professor access required." });
  }

  const [existingCourses] = await connection.query(
   "SELECT id FROM courses WHERE UPPER(code) = ? LIMIT 1",
   [code],
  );

  if (existingCourses.length > 0) {
   return res.status(409).json({ message: "A course with that code already exists." });
  }

  await connection.beginTransaction();
  transactionStarted = true;

  const [courseResult] = await connection.query(
   `
    INSERT INTO courses (name, code, meeting_days, start_date, end_date, start_time, end_time, primary_professor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
   `,
   [
    courseName,
    code,
    serializeMeetingDays(meetingDays),
    startDate,
    endDate,
    startTime,
    endTime,
    userId,
   ],
  );

  const courseId = courseResult.insertId;

  await connection.query(
   "INSERT INTO course_instructors (course_id, user_id, role) VALUES (?, ?, 'primary')",
   [courseId, userId],
  );

  for (const [index, sessionDate] of sessionDates.entries()) {
   await connection.query(
    "INSERT INTO course_sessions (course_id, session_date, start_time, end_time) VALUES (?, ?, ?, ?)",
    [courseId, sessionDate, startTime, endTime],
   );
   await connection.query(
    `
     INSERT INTO lectures (course_id, title, lecture_date, lecture_number, start_time, end_time)
     VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
     courseId,
     `${code} Lecture ${index + 1}`,
     sessionDate,
     index + 1,
     startTime,
     endTime,
    ],
   );
  }

  await connection.commit();

  res.status(201).json({
   message: "Course created successfully.",
   courseId,
   generatedLectures: sessionDates.length,
  });
 } catch (error) {
  if (transactionStarted) {
   await connection.rollback();
  }

  console.error("Error creating course:", error);
  res.status(500).json({ message: "Unable to create the course." });
 }
};

const deleteProfessorCourse = async (req, res) => {
 const courseId = Number.parseInt(req.params.courseId, 10);
 const userId = Number.parseInt(req.user?.id, 10);
 const connection = db.promise();
 let transactionStarted = false;

 if (!courseId) {
  return res.status(400).json({ message: "Invalid course id." });
 }

 try {
  const [courseRows] = await connection.query(
   "SELECT id, name, primary_professor_id FROM courses WHERE id = ? LIMIT 1",
   [courseId],
  );

  if (courseRows.length === 0) {
   return res.status(404).json({ message: "Course not found." });
  }

  if (courseRows[0].primary_professor_id !== userId) {
   return res.status(403).json({
    message: "Only the primary professor can delete this course.",
   });
  }

  await connection.beginTransaction();
  transactionStarted = true;

  await connection.query(
   `
    DELETE du
    FROM doubt_upvotes du
    INNER JOIN lecture_doubts ld ON ld.id = du.doubt_id
    INNER JOIN lectures l ON l.id = ld.lecture_id
    WHERE l.course_id = ?
   `,
   [courseId],
  );
  await connection.query(
   `
    DELETE child
    FROM lecture_doubts child
    INNER JOIN lecture_doubts parent ON child.parent_id = parent.id
    INNER JOIN lectures l ON l.id = parent.lecture_id
    WHERE l.course_id = ?
   `,
   [courseId],
  );
  await connection.query(
   `
    DELETE lf
    FROM lecture_feedback lf
    INNER JOIN lectures l ON l.id = lf.lecture_id
    WHERE l.course_id = ?
   `,
   [courseId],
  );
  await connection.query(
   `
    DELETE ld
    FROM lecture_doubts ld
    INNER JOIN lectures l ON l.id = ld.lecture_id
    WHERE l.course_id = ?
   `,
   [courseId],
  );
  await connection.query("DELETE FROM lectures WHERE course_id = ?", [courseId]);
  await connection.query("DELETE FROM course_sessions WHERE course_id = ?", [
   courseId,
  ]);
  await connection.query("DELETE FROM course_enrollments WHERE course_id = ?", [
   courseId,
  ]);
  await connection.query("DELETE FROM student_course_aliases WHERE course_id = ?", [
   courseId,
  ]);
  await connection.query("DELETE FROM course_instructors WHERE course_id = ?", [
   courseId,
  ]);
  await connection.query(
   `
    DELETE fv
    FROM feedback_votes fv
    INNER JOIN course_feedback cf ON cf.feedback_id = fv.feedback_id
    WHERE cf.course_name = ?
   `,
   [courseRows[0].name],
  );
  await connection.query("DELETE FROM course_feedback WHERE course_name = ?", [
   courseRows[0].name,
  ]);
  await connection.query("DELETE FROM courses WHERE id = ?", [courseId]);

  await connection.commit();

  res.json({ message: "Course deleted successfully." });
 } catch (error) {
  if (transactionStarted) {
   await connection.rollback();
  }

  console.error("Error deleting course:", error);
  res.status(500).json({ message: "Unable to delete the course." });
 }
};

const addCourseStaff = async (req, res) => {
 const courseId = Number.parseInt(req.params.courseId, 10);
 const userId = Number.parseInt(req.user?.id, 10);
 const email = normalizeEmail(req.body.email);
 const role = normalizeText(req.body.role).toLowerCase();
 const connection = db.promise();

 if (!courseId || !email || !["co-instructor", "ta"].includes(role)) {
  return res.status(400).json({
   message: "Course, IITK email, and a valid role are required.",
  });
 }

 if (!IITK_EMAIL_REGEX.test(email)) {
  return res.status(400).json({ message: "Use a valid IITK email address." });
 }

 try {
  const allowed = await canManageCourse(connection, courseId, userId);

  if (!allowed) {
   return res.status(403).json({ message: "You do not manage this course." });
  }

  const [users] = await connection.query(
   "SELECT user_id, role, name FROM users WHERE LOWER(email) = ? LIMIT 1",
   [email],
  );

  if (users.length === 0) {
   return res.status(404).json({
    message: "No Campus Connect account was found for that IITK email.",
   });
  }

  const targetUser = users[0];

  if (role === "co-instructor" && targetUser.role !== "professor") {
   return res.status(400).json({
    message: "Co-instructors must already have a professor account.",
   });
  }

  await connection.query(
   `
    INSERT INTO course_instructors (course_id, user_id, role)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE role = VALUES(role)
   `,
   [courseId, targetUser.user_id, role],
  );

  res.json({
   message: `${targetUser.name} added as ${role}.`,
  });
 } catch (error) {
  console.error("Error adding course staff:", error);
  res.status(500).json({ message: "Unable to update course staff." });
 }
};

const addCourseStudents = async (req, res) => {
 const courseId = Number.parseInt(req.params.courseId, 10);
 const userId = Number.parseInt(req.user?.id, 10);
 const connection = db.promise();
 const rawEmails = Array.isArray(req.body.emails) ? req.body.emails : [];
 const emails = [...new Set(rawEmails.map(normalizeEmail).filter(Boolean))];
 let transactionStarted = false;

 if (!courseId || emails.length === 0) {
  return res.status(400).json({
   message: "Provide at least one IITK student email.",
  });
 }

 if (emails.some((email) => !IITK_EMAIL_REGEX.test(email))) {
  return res.status(400).json({
   message: "Every uploaded email must be a valid IITK email address.",
  });
 }

 try {
  const allowed = await canManageCourse(connection, courseId, userId);

  if (!allowed) {
   return res.status(403).json({ message: "You do not manage this course." });
  }

  const placeholders = emails.map(() => "?").join(",");
  const [studentRows] = await connection.query(
   `
    SELECT user_id, name, email, anonymous_username
    FROM users
    WHERE role = 'student' AND LOWER(email) IN (${placeholders})
   `,
   emails,
  );

  const foundEmails = new Set(studentRows.map((row) => normalizeEmail(row.email)));
  const missingEmails = emails.filter((email) => !foundEmails.has(email));

  await connection.beginTransaction();
  transactionStarted = true;

  let addedCount = 0;

  for (const student of studentRows) {
   const [existingEnrollment] = await connection.query(
    "SELECT 1 FROM course_enrollments WHERE course_id = ? AND student_id = ? LIMIT 1",
    [courseId, student.user_id],
   );

   if (existingEnrollment.length > 0) {
    continue;
   }

   await connection.query(
    "INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?)",
    [courseId, student.user_id],
   );
   await connection.query(
    `
     INSERT INTO student_course_aliases (student_id, course_id, alias)
     VALUES (?, ?, ?)
    `,
    [
     student.user_id,
     courseId,
     student.anonymous_username || `anonymous_${student.user_id}`,
    ],
   );
   addedCount += 1;
  }

  await connection.commit();

  res.json({
   message: addedCount
    ? `${addedCount} student${addedCount === 1 ? "" : "s"} added successfully.`
    : "No new students were added.",
   addedCount,
   missingEmails,
  });
 } catch (error) {
  if (transactionStarted) {
   await connection.rollback();
  }

  console.error("Error adding students to course:", error);
  res.status(500).json({ message: "Unable to add students to the course." });
 }
};

const getLectureDiscussion = async (req, res) => {
 const courseId = Number.parseInt(req.params.courseId, 10);
 const lectureId = Number.parseInt(req.params.lectureId, 10);
 const userId = Number.parseInt(req.user?.id, 10);
 const connection = db.promise();

 if (!courseId || !lectureId) {
  return res.status(400).json({ message: "Invalid lecture request." });
 }

 try {
  const allowed = await canManageCourse(connection, courseId, userId);

  if (!allowed) {
   return res.status(403).json({ message: "You do not manage this course." });
  }

  const [lectureRows] = await connection.query(
   `
    SELECT id, title, lecture_date, lecture_number, start_time, end_time
    FROM lectures
    WHERE id = ? AND course_id = ?
    LIMIT 1
   `,
   [lectureId, courseId],
  );

  if (lectureRows.length === 0) {
   return res.status(404).json({ message: "Lecture not found." });
  }

  const lectureState = buildLectureStatus(
   lectureRows[0].lecture_date,
   lectureRows[0].start_time,
   lectureRows[0].end_time,
  );

  if (!lectureState.isAccessible) {
   return res.status(403).json({
    message: "Discussion becomes available only after the lecture starts.",
   });
  }

  const [doubts] = await connection.query(
   `
    SELECT
     id,
     alias,
     content,
     parent_id,
     is_resolved,
     upvotes,
     created_at,
     updated_at
    FROM lecture_doubts
    WHERE lecture_id = ?
    ORDER BY created_at ASC
   `,
   [lectureId],
  );

  const [feedback] = await connection.query(
   `
    SELECT
     id,
     alias,
     clarity,
     pace,
     engagement,
     content_quality,
     overall,
     comment,
     submitted_at
    FROM lecture_feedback
    WHERE lecture_id = ?
    ORDER BY submitted_at DESC
   `,
   [lectureId],
  );

  res.json({
   lecture: {
    id: lectureRows[0].id,
    title: lectureRows[0].title,
    lectureDate: normalizeDateValue(lectureRows[0].lecture_date),
    lectureNumber: lectureRows[0].lecture_number,
    startTime: lectureState.startsAt,
    endTime: lectureState.endsAt,
    status: lectureState.status,
    isAccessible: lectureState.isAccessible,
    isInteractionOpen: lectureState.isInteractionOpen,
   },
   doubts: doubts.map((doubt) => ({
    ...doubt,
    alias: "Anonymous student",
   })),
   feedback: feedback.map((entry) => ({
    ...entry,
    alias: "Anonymous student",
   })),
  });
 } catch (error) {
  console.error("Error fetching lecture discussion:", error);
  res.status(500).json({ message: "Unable to load lecture discussion." });
 }
};

module.exports = {
 addCourseStaff,
 addCourseStudents,
 createProfessorCourse,
 deleteProfessorCourse,
 getLectureDiscussion,
 getLectureLiveHub,
 getProfessorCourseDetail,
 getProfessorManagedCourses,
 getStudentCourseTimeline,
 getStudentCourses,
 postLectureLiveComment,
 submitLectureRating,
};
