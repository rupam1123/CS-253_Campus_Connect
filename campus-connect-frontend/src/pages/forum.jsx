import { useDeferredValue, useState } from "react";
import useSWR from "swr";
import DashboardLayout from "../layouts/dashboard_layout";
import { fetchJson, getErrorMessage } from "../lib/api.js";
import { getStoredUser } from "../lib/session.js";
import {
 AlertCircle,
 ArrowBigDown,
 ArrowBigUp,
 CheckCircle,
 Clock,
 MessageSquare,
 Plus,
 Search,
 UserCircle,
 X,
} from "lucide-react";

const TAGS = ["General", "Academics", "Projects", "Study Group", "Career"];

function Forum() {
 const user = getStoredUser();
 const userId = user?.id;
 const anonymousUsername = user?.anonymousUsername || "Anonymous User";
 const [searchQuery, setSearchQuery] = useState("");
 const deferredSearchQuery = useDeferredValue(searchQuery);
 const [showNewPostModal, setShowNewPostModal] = useState(false);
 const [toast, setToast] = useState({ show: false, message: "", type: "success" });
 const [expandedPostId, setExpandedPostId] = useState(null);
 const [newCommentText, setNewCommentText] = useState("");
 const [newPost, setNewPost] = useState({
  title: "",
  content: "",
  tag: "General",
 });

 const {
  data: posts = [],
  error: postsError,
  isLoading: postsLoading,
  mutate: mutatePosts,
 } = useSWR(
  userId ? `/api/forum/posts?userId=${userId}` : "/api/forum/posts",
 );

 const {
  data: comments = [],
  error: commentsError,
  isLoading: commentsLoading,
  mutate: mutateComments,
 } = useSWR(
  expandedPostId ? `/api/forum/comments/${expandedPostId}` : null,
 );

 const topLevelComments = comments.filter((comment) => comment.parent_id === null);
 const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
 const filteredPosts = posts.filter((post) => {
  const searchableFields = [post.title, post.tag, post.content]
   .filter(Boolean)
   .map((value) => String(value).toLowerCase());

  return searchableFields.some((value) => value.includes(normalizedQuery));
 });

 const showToast = (message, type = "success") => {
  setToast({ show: true, message, type });
  window.setTimeout(() => {
   setToast((current) => ({ ...current, show: false }));
  }, 3200);
 };

 const handleVote = async (id, voteType) => {
  const selectedPost = posts.find((post) => post.id === id || post._id === id);

  if (!selectedPost) {
   return;
  }

  if (selectedPost.userVote) {
   showToast("You can only vote once per forum post.", "error");
   return;
  }

  const optimisticPosts = posts.map((post) => {
   if (post.id !== id && post._id !== id) {
    return post;
   }

   return {
    ...post,
    upvotes: (post.upvotes || 0) + (voteType === "up" ? 1 : 0),
    downvotes: (post.downvotes || 0) + (voteType === "down" ? 1 : 0),
    userVote: voteType,
   };
  });

  await mutatePosts(optimisticPosts, false);

  try {
   await fetchJson("/api/forum/vote", {
    method: "POST",
    body: {
     postId: id,
     userId,
     voteType,
     upvotes: (selectedPost.upvotes || 0) + (voteType === "up" ? 1 : 0),
     downvotes:
      (selectedPost.downvotes || 0) + (voteType === "down" ? 1 : 0),
    },
   });
   await mutatePosts();
   showToast(`Post ${voteType === "up" ? "upvoted" : "downvoted"} successfully.`);
  } catch (error) {
   await mutatePosts();
   showToast(getErrorMessage(error, "Unable to save your vote."), "error");
  }
 };

 const handleCreatePost = async (event) => {
  event.preventDefault();

  if (!newPost.title.trim() || !newPost.content.trim()) {
   showToast("Please fill out both the post title and details.", "error");
   return;
  }

  try {
   const savedPost = await fetchJson("/api/forum/create-post", {
    method: "POST",
   body: {
     title: newPost.title.trim(),
     content: newPost.content.trim(),
     tag: newPost.tag,
     userId,
     authorAlias: anonymousUsername,
    },
   });

   const safeNewPost = {
    id:
     savedPost.id ||
     savedPost._id ||
     `draft-${newPost.tag}-${newPost.title.trim().toLowerCase().replaceAll(" ", "-")}`,
    title: savedPost.title || newPost.title.trim(),
    content: savedPost.content || newPost.content.trim(),
    tag: savedPost.tag || newPost.tag,
    author_alias:
     savedPost.author_alias || savedPost.author || anonymousUsername,
    upvotes: savedPost.upvotes || 0,
    downvotes: savedPost.downvotes || 0,
    comments: savedPost.comments || 0,
    created_at: savedPost.created_at || null,
    userVote: null,
   };

   await mutatePosts((current = []) => [safeNewPost, ...current], false);
   setShowNewPostModal(false);
   setNewPost({ title: "", content: "", tag: "General" });
   showToast("Your post has been published to the forum.");
  } catch (error) {
   showToast(getErrorMessage(error, "Unable to publish your post."), "error");
  }
 };

 const handleToggleComments = (postId) => {
  setExpandedPostId((current) => (current === postId ? null : postId));
  setNewCommentText("");
 };

 const handleAddComment = async (postId) => {
  if (!newCommentText.trim()) {
   return;
  }

  const temporaryComment = {
   id: `temp-${postId}-${topLevelComments.length}`,
   post_id: postId,
   parent_id: null,
   content: newCommentText.trim(),
   author_alias: anonymousUsername,
   created_at: null,
  };

  await mutateComments((current = []) => [...current, temporaryComment], false);
  await mutatePosts(
   (current = []) =>
    current.map((post) =>
     post.id === postId ? { ...post, comments: (post.comments || 0) + 1 } : post,
    ),
   false,
  );

  try {
   await fetchJson("/api/forum/add-comment", {
    method: "POST",
     body: {
      post_id: postId,
      parent_id: null,
      content: newCommentText.trim(),
      userId,
      authorAlias: anonymousUsername,
     },
    });

   setNewCommentText("");
   await Promise.all([mutateComments(), mutatePosts()]);
   showToast("Comment added successfully.");
  } catch (error) {
   await Promise.all([mutateComments(), mutatePosts()]);
   showToast(getErrorMessage(error, "Unable to save your comment."), "error");
  }
 };

 return (
  <DashboardLayout>
   <div className="space-y-8">
    {toast.show && (
     <div
      className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 rounded-2xl px-6 py-4 text-white shadow-2xl ${
       toast.type === "success" ? "bg-emerald-600" : "bg-rose-500"
      }`}
     >
      {toast.type === "success" ? (
       <CheckCircle size={22} />
      ) : (
       <AlertCircle size={22} />
      )}
      <div>
       <p className="text-xs font-black uppercase tracking-[0.18em]">
        {toast.type === "success" ? "Success" : "Error"}
       </p>
       <p className="font-semibold">{toast.message}</p>
      </div>
      <button
       type="button"
       onClick={() => setToast((current) => ({ ...current, show: false }))}
       className="text-white/80 transition hover:text-white"
      >
       <X size={18} />
      </button>
     </div>
    )}

    <div className="glass-panel rounded-[28px] p-6 sm:p-8">
     <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
       <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-600">
        Community Forum
       </p>
       <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        Ask questions, share context, and find teammates faster
       </h2>
       <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
        The forum now keeps discussion state in sync more reliably so new posts,
        comments, and votes stay responsive without drifting from the server.
       </p>
      </div>

      <div className="flex w-full gap-3 md:w-auto">
       <div className="relative w-full md:w-80">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
         <Search size={18} />
        </div>
        <input
         type="text"
         value={searchQuery}
         onChange={(event) => setSearchQuery(event.target.value)}
         placeholder="Search discussions..."
         className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 pl-11 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500"
        />
       </div>
       <button
        type="button"
        onClick={() => setShowNewPostModal(true)}
        className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 font-bold text-white transition hover:bg-sky-600"
       >
        <Plus size={18} />
        New Post
       </button>
      </div>
     </div>
    </div>

    {(postsError || commentsError) && (
     <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
      {getErrorMessage(
       postsError || commentsError,
       "Unable to load the forum right now.",
      )}
     </div>
    )}

    <div className="space-y-4">
     {postsLoading ? (
      <div className="glass-panel rounded-[28px] px-6 py-16 text-center text-sm font-medium text-slate-500">
       Loading forum posts...
      </div>
     ) : filteredPosts.length > 0 ? (
      filteredPosts.map((post) => {
       const postId = post.id || post._id;

       return (
        <div
         key={postId}
         className="glass-panel flex gap-5 rounded-[28px] p-5"
        >
         <div className="flex min-w-[56px] flex-col items-center gap-1 rounded-2xl border border-slate-100 bg-white/80 p-2">
          <button
           type="button"
           onClick={() => handleVote(postId, "up")}
           disabled={Boolean(post.userVote)}
           className={`rounded-xl p-1 transition ${
            post.userVote === "up"
             ? "bg-emerald-100 text-emerald-600"
             : post.userVote
              ? "cursor-not-allowed text-slate-300 opacity-50"
              : "text-slate-400 hover:bg-slate-200 hover:text-emerald-600"
           }`}
          >
           <ArrowBigUp
            size={24}
            className={post.userVote === "up" ? "fill-emerald-600" : ""}
           />
          </button>

          <span
           className={`text-sm font-black ${
            post.userVote === "up"
             ? "text-emerald-600"
             : post.userVote === "down"
              ? "text-rose-600"
              : "text-slate-700"
           }`}
          >
           {(post.upvotes || 0) - (post.downvotes || 0)}
          </span>

          <button
           type="button"
           onClick={() => handleVote(postId, "down")}
           disabled={Boolean(post.userVote)}
           className={`rounded-xl p-1 transition ${
            post.userVote === "down"
             ? "bg-rose-100 text-rose-600"
             : post.userVote
              ? "cursor-not-allowed text-slate-300 opacity-50"
              : "text-slate-400 hover:bg-slate-200 hover:text-rose-600"
           }`}
          >
           <ArrowBigDown
            size={24}
            className={post.userVote === "down" ? "fill-rose-600" : ""}
           />
          </button>
         </div>

         <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
           <h3 className="text-2xl font-black tracking-tight text-slate-900">
            {post.title}
          </h3>
           <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
            {post.tag}
           </span>
          </div>

          <p className="text-sm leading-7 text-slate-600">{post.content}</p>

          <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3 text-xs font-bold text-slate-400">
           <div className="flex items-center gap-1">
            <UserCircle size={18} className="text-slate-500" />
            {post.author_alias || anonymousUsername}
           </div>
           <div className="flex items-center gap-1">
            <Clock size={18} className="text-slate-500" />
            {post.created_at
             ? new Date(post.created_at).toLocaleString()
             : "Just now"}
           </div>
           <button
            type="button"
            onClick={() => handleToggleComments(postId)}
            className="flex items-center gap-1 text-sky-600 transition hover:text-sky-700"
           >
            <MessageSquare size={18} />
            Comments ({post.comments || 0})
           </button>
          </div>

          {expandedPostId === postId && (
           <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="scrollbar-none max-h-64 space-y-3 overflow-y-auto pr-1">
             {commentsLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-center text-sm font-medium text-slate-500">
               Loading comments...
              </div>
             ) : topLevelComments.length > 0 ? (
              topLevelComments.map((comment) => (
               <div
                key={comment.id}
                className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm"
               >
                <p className="text-sm leading-7 text-slate-700">
                 {comment.content}
                </p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-sky-600">
                 @{comment.author_alias || "Anonymous User"}
                </p>
                <span className="mt-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                 {comment.created_at
                  ? new Date(comment.created_at).toLocaleString()
                  : "Just now"}
                </span>
               </div>
              ))
             ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-8 text-center text-sm font-medium text-slate-500">
               No comments yet. Start the discussion.
              </div>
             )}
            </div>

            <div className="mt-4 flex gap-2">
             <input
              type="text"
              value={newCommentText}
              onChange={(event) => setNewCommentText(event.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500"
             />
             <button
              type="button"
              onClick={() => handleAddComment(postId)}
              className="rounded-2xl bg-sky-600 px-5 py-3 font-bold text-white transition hover:bg-sky-700"
             >
              Post
             </button>
            </div>
           </div>
          )}
         </div>
        </div>
       );
      })
     ) : (
      <div className="glass-panel rounded-[28px] px-6 py-16 text-center">
       <MessageSquare size={48} className="mx-auto text-slate-300" />
       <h3 className="mt-5 text-xl font-black text-slate-900">
        No discussions matched your search
       </h3>
       <p className="mt-2 text-sm text-slate-500">
        Try a different keyword or start a new thread.
       </p>
      </div>
     )}
    </div>

    {showNewPostModal && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-[32px] bg-white shadow-[0_32px_100px_rgba(15,23,42,0.24)]">
       <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="text-2xl font-black text-slate-900">
         Create a new forum post
        </h3>
        <p className="mt-1 text-sm text-slate-500">
         Share context clearly so others can respond quickly.
        </p>
       </div>

       <form onSubmit={handleCreatePost} className="space-y-5 p-6">
        <div>
         <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
          Discussion Topic
         </label>
         <select
          value={newPost.tag}
          onChange={(event) =>
           setNewPost((current) => ({ ...current, tag: event.target.value }))
          }
          className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
         >
          {TAGS.map((tag) => (
           <option key={tag} value={tag}>
            {tag}
           </option>
          ))}
         </select>
        </div>

        <div>
         <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
          Post Title
         </label>
         <input
          type="text"
          required
          value={newPost.title}
          onChange={(event) =>
           setNewPost((current) => ({ ...current, title: event.target.value }))
          }
          placeholder="Keep it brief and specific"
          className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
         />
        </div>

        <div>
         <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
          Details
         </label>
         <textarea
          required
          rows="7"
          maxLength="500"
          value={newPost.content}
          onChange={(event) =>
           setNewPost((current) => ({
            ...current,
            content: event.target.value,
           }))
          }
          placeholder="Add context, constraints, or what kind of help you need."
          className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
         />
         <p className="mt-2 text-right text-[11px] font-medium text-slate-400">
          {newPost.content.length}/500
         </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row">
         <button
          type="button"
          onClick={() => setShowNewPostModal(false)}
          className="rounded-2xl bg-slate-100 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-200"
         >
          Cancel
         </button>
         <button
          type="submit"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 font-bold text-white transition hover:bg-sky-700"
         >
          <Plus size={18} />
          Publish Post
         </button>
        </div>
       </form>
      </div>
    </div>
   )}
  </div>
 </DashboardLayout>
 );
}

export default Forum;
