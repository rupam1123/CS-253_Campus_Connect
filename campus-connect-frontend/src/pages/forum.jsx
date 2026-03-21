//import { useState } from "react";
import { useState, useEffect } from "react";

import DashboardLayout from "../layouts/dashboard_layout";
import {
 Search,
 MessageSquare,
 ArrowBigUp,
 ArrowBigDown,
 Plus,
 CheckCircle,
 X,
 Clock,
 Tag,
 UserCircle,
} from "lucide-react";

function Forum() {
 const [searchQuery, setSearchQuery] = useState("");
 const [toastMessage, setToastMessage] = useState(null);
 const [showNewPostModal, setShowNewPostModal] = useState(false);

 const [newPost, setNewPost] = useState({
  title: "",
  content: "",
  tag: "General",
 });
 // --- COMMENT STATE ---
 const [expandedPostId, setExpandedPostId] = useState(null); // Tracks which post's comments are open
 const [comments, setComments] = useState([]); // Holds the fetched comments
 const [newCommentText, setNewCommentText] = useState(""); // Holds the text being typed

 // Initial Mock Data with a 'userVote' property to track if the current user has voted
 const [posts, setPosts] = useState([]);
 useEffect(() => {
  const fetchPosts = async () => {
   try {
    // Replace with your actual backend URL port (e.g., http://localhost:5000/posts)
    const response = await fetch("http://localhost:5001/api/forum/posts");
    if (response.ok) {
     const data = await response.json();
     // 1. Grab the "memory" of votes from the browser
     const savedVotes = JSON.parse(
      localStorage.getItem("my_forum_votes") || "{}",
     );

     // 2. Loop through the backend data and re-apply the user's past votes
     const postsWithMemory = data.map((post) => ({
      ...post,
      // If the post ID is in local storage, set userVote (which freezes the button!)
      userVote: savedVotes[post.id || post._id] || null,
     }));
     setPosts(postsWithMemory);
    }
   } catch (error) {
    console.error("Failed to fetch posts:", error);
   }
  };

  fetchPosts();
 }, []);
 // ADVANCED VOTING LOGIC (Ensures 1 vote per user, allows toggling/switching)
 const handleVote = async (id, voteType) => {
  // 1. Find the post to check its current status
  const postToVote = posts.find((p) => p.id === id || p._id === id);

  // 2. THE FREEZE CHECK: If they already voted, do absolutely nothing.
  if (postToVote && postToVote.userVote) {
   return;
  }

  // 3. Calculate the new numbers (Adding 1 to whichever they picked)
  let newUpvotes = postToVote.upvotes || 0;
  let newDownvotes = postToVote.downvotes || 0;
  voteType === "up" ? newUpvotes++ : newDownvotes++;

  // 4. Update the UI instantly and lock in their 'userVote'
  setPosts(
   posts.map((post) => {
    if (post.id === id || post._id === id) {
     return {
      ...post,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVote: voteType,
     };
    }
    return post;
   }),
  );

  // 5. TRIGGER THE POPUP
  setToastMessage(`Successfully ${voteType}voted!`);
  setTimeout(() => setToastMessage(null), 3000);
  const currentSavedVotes = JSON.parse(
   localStorage.getItem("my_forum_votes") || "{}",
  );
  currentSavedVotes[id] = voteType; // Example: { "1": "up", "2": "down" }
  localStorage.setItem("my_forum_votes", JSON.stringify(currentSavedVotes));

  // 6. Tell the Backend to save it
  try {
   const response = await fetch("http://localhost:5001/api/forum/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     postId: id,
     upvotes: newUpvotes,
     downvotes: newDownvotes,
    }),
   });

   if (!response.ok) {
    console.error("Server rejected the vote");
   }
  } catch (error) {
   console.error("Failed to save vote to server:", error);
  }
 };
 const handleCreatePost = async (e) => {
  e.preventDefault();

  // 1. Give the user feedback if fields are empty
  if (!newPost.title.trim() || !newPost.content.trim()) {
   alert("Please fill out both the title and the details.");
   return;
  }

  try {
   const response = await fetch("http://localhost:5001/api/forum/create-post", {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     title: newPost.title,
     content: newPost.content,
     tag: newPost.tag,
     author: "You",
    }),
   });

   if (response.ok) {
    const savedPost = await response.json();

    // 1. Let's look at exactly what the backend gave us
    console.log("Data from backend:", savedPost);

    // 2. Create a "safe" post object with defaults to prevent crashes
    // If the backend didn't send a field, we provide a safe fallback
    const safeNewPost = {
     id: savedPost.id || savedPost._id || Date.now(), // Handles SQL, MongoDB, or missing IDs
     title: savedPost.title || newPost.title || "",
     content: savedPost.content || newPost.content || "",
     tag: savedPost.tag || newPost.tag || "General",
     author: savedPost.author || "You",
     upvotes: savedPost.upvotes || 0,
     downvotes: savedPost.downvotes || 0,
     comments: savedPost.comments || 0,
     time: savedPost.time || "Just now",
     userVote: null,
    };

    // Add the SAFE post to the top of the list in the UI
    setPosts([safeNewPost, ...posts]);

    // Close modal and reset form
    setShowNewPostModal(false);
    setNewPost({ title: "", content: "", tag: "General" });

    // Show success message
    setToastMessage("Your post has been published to the forum!");
    setTimeout(() => setToastMessage(null), 3000);
   } else {
    // 2. Alert if the server throws a 400 or 500 error
    console.error("Server responded with:", response.status);
    alert(`Server Error: Could not save the post. Status: ${response.status}`);
   }
  } catch (error) {
   // 3. Alert if the network fails completely (like a CORS error)
   console.error("Error creating post:", error);
   alert(
    "Network Error: Could not reach the server. Check your console for CORS or connection issues.",
   );
  }
 };

 // --- FETCH COMMENTS ---
 const handleToggleComments = async (postId) => {
  // If they click the same post again, close the section
  if (expandedPostId === postId) {
   setExpandedPostId(null);
   return;
  }

  setExpandedPostId(postId);
  setComments([]); // Clear out old comments while loading

  try {
   const response = await fetch(
    `http://localhost:5001/api/forum/comments/${postId}`,
   );
   if (response.ok) {
    const data = await response.json();
    // For now, let's only grab top-level comments (where parent_id is null)
    const topLevelComments = data.filter((c) => c.parent_id === null);
    setComments(topLevelComments);
   }
  } catch (error) {
   console.error("Failed to fetch comments:", error);
  }
 };

 // --- SUBMIT NEW COMMENT ---
 const handleAddComment = async (postId) => {
  if (!newCommentText.trim()) return;

  try {
   const response = await fetch("http://localhost:5001/api/forum/add-comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     post_id: postId,
     parent_id: null, // Explicitly null for top-level comments
     content: newCommentText,
    }),
   });

   if (response.ok) {
    setNewCommentText(""); // Clear the input box
    setToastMessage("Comment added!");
    setTimeout(() => setToastMessage(null), 3000);

    // Re-fetch comments to show the new one instantly
    handleToggleComments(postId);
    setTimeout(() => handleToggleComments(postId), 50); // Quick hack to trigger the re-fetch
   } else {
    alert("Failed to save comment.");
   }
  } catch (error) {
   console.error("Error saving comment:", error);
  }
 };

 const filteredPosts = posts.filter(
  (p) =>
   p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
   p.tag.toLowerCase().includes(searchQuery.toLowerCase()),
 );

 const tags = ["General", "Academics", "Projects", "Study Group", "Career"];

 return (
  <DashboardLayout>
   <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
    {/* TOAST NOTIFICATION */}
    {toastMessage && (
     <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-bottom-8 slide-in-from-right-8 duration-300">
      <CheckCircle size={24} />
      <div>
       <p className="text-sm font-black uppercase tracking-widest text-green-200 mb-0.5">
        Success
       </p>
       <p className="font-bold">{toastMessage}</p>
      </div>
      <button
       onClick={() => setToastMessage(null)}
       className="ml-4 text-green-200 hover:text-white"
      >
       <X size={18} />
      </button>
     </div>
    )}

    {/* HEADER & SEARCH BAR */}
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
     <div>
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
       Community Forum
      </h2>
      <p className="text-slate-500 mt-1">
       Ask questions, find teammates, and discuss coursework.
      </p>
     </div>

     <div className="flex w-full md:w-auto gap-3">
      <div className="relative w-full md:w-80">
       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
        <Search size={18} />
       </div>
       <input
        type="text"
        placeholder="Search discussions..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium text-slate-700 shadow-sm text-sm"
       />
      </div>
      <button
       onClick={() => setShowNewPostModal(true)}
       className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 whitespace-nowrap"
      >
       <Plus size={20} /> New Post
      </button>
     </div>
    </div>

    {/* FORUM FEED */}
    <div className="space-y-4">
     {filteredPosts.length > 0 ? (
      filteredPosts.map((post) => (
       <div
        key={post.id}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:border-indigo-300 transition-all duration-300 flex gap-5"
       >
        {/* VOTING COLUMN */}
        {/* VOTING COLUMN */}
        <div className="flex flex-col items-center gap-1 bg-slate-50 rounded-xl p-2 h-fit border border-slate-100 min-w-[50px]">
         <button
          onClick={() => handleVote(post.id || post._id, "up")}
          disabled={!!post.userVote} // FREEZES THE BUTTON IF THEY VOTED
          className={`transition-colors p-1 rounded-md ${
           post.userVote === "up"
            ? "text-green-600 bg-green-100 cursor-default" // Highlighted if they picked this
            : post.userVote
              ? "text-slate-300 opacity-50 cursor-not-allowed" // Grayed out if they voted down
              : "text-slate-400 hover:text-green-600 hover:bg-slate-200" // Normal hover state
          }`}
         >
          <ArrowBigUp
           size={24}
           className={post.userVote === "up" ? "fill-green-600" : ""}
          />
         </button>

         <span
          className={`font-black text-sm ${
           post.userVote === "up"
            ? "text-green-600"
            : post.userVote === "down"
              ? "text-red-600"
              : "text-slate-700"
          }`}
         >
          {post.upvotes - post.downvotes}
         </span>

         <button
          onClick={() => handleVote(post.id || post._id, "down")}
          disabled={!!post.userVote} // FREEZES THE BUTTON IF THEY VOTED
          className={`transition-colors p-1 rounded-md ${
           post.userVote === "down"
            ? "text-red-600 bg-red-100 cursor-default" // Highlighted if they picked this
            : post.userVote
              ? "text-slate-300 opacity-50 cursor-not-allowed" // Grayed out if they voted up
              : "text-slate-400 hover:text-red-600 hover:bg-slate-200" // Normal hover state
          }`}
         >
          <ArrowBigDown
           size={24}
           className={post.userVote === "down" ? "fill-red-600" : ""}
          />
         </button>
        </div>

        {/* CONTENT COLUMN */}
        <div className="flex-1 space-y-3">
         <div className="flex justify-between items-start gap-4">
          <h3 className="text-xl font-bold text-slate-800 leading-tight">
           {post.title}
          </h3>
          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100 shrink-0">
           {post.tag}
          </span>
         </div>

         <p className="text-slate-600 text-sm leading-relaxed">
          {post.content}
         </p>

         <div className="flex flex-wrap items-center gap-4 pt-2 mt-2 border-t border-slate-50 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-1">
           <UserCircle size={14} className="text-slate-500" /> Anonymous User
          </div>
          <div className="flex items-center gap-1">
           <Clock size={14} className="text-slate-500" /> {post.time}
          </div>
          <div
           onClick={() => handleToggleComments(post.id)}
           className="flex items-center gap-1 hover:text-indigo-600 cursor-pointer transition-colors"
          >
           <MessageSquare size={14} className="text-indigo-500" />{" "}
           {post.comments} Comments
          </div>
         </div>

         {/* --- COMMENTS DROP-DOWN UI --- */}
         {expandedPostId === post.id && (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
           {/* 1. Display Existing Comments */}
           <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-2">
            {comments.length > 0 ? (
             comments.map((comment) => (
              <div
               key={comment.id}
               className="bg-slate-50 p-3 rounded-xl border border-slate-200"
              >
               <p className="text-slate-700 text-sm">{comment.content}</p>
               <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                 {new Date(comment.created_at).toLocaleString()}
                </span>
                {/* We will add the "Reply" button here in the next step! */}
               </div>
              </div>
             ))
            ) : (
             <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No comments yet. Be the first to share your thoughts!
             </p>
            )}
           </div>

           {/* 2. Add New Comment Input */}
           <div className="flex gap-2">
            <input
             type="text"
             placeholder="Write a comment..."
             value={newCommentText}
             onChange={(e) => setNewCommentText(e.target.value)}
             className="flex-1 px-4 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-indigo-400 transition-colors"
            />
            <button
             onClick={() => handleAddComment(post.id)}
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md transition-colors"
            >
             Post
            </button>
           </div>
          </div>
         )}
        </div>
       </div>
      ))
     ) : (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
       <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
       <h3 className="text-lg font-bold text-slate-700">
        No discussions found
       </h3>
       <p className="text-slate-500">
        Try adjusting your search or start a new post.
       </p>
      </div>
     )}
    </div>

    {/* NEW POST MODAL */}
    {showNewPostModal && (
     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
       className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
       onClick={() => setShowNewPostModal(false)}
      ></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
       <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
         <h3 className="text-xl font-bold text-slate-900">Create a New Post</h3>
         <p className="text-sm text-slate-500 font-medium mt-1">
          Start a discussion with the campus community.
         </p>
        </div>
        <button
         onClick={() => setShowNewPostModal(false)}
         className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
        >
         <X size={20} />
        </button>
       </div>

       <form onSubmit={handleCreatePost} className="p-6 space-y-5">
        <div>
         <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">
          Discussion Topic <span className="text-red-500">*</span>
         </label>
         <select
          value={newPost.tag}
          onChange={(e) => setNewPost({ ...newPost, tag: e.target.value })}
          className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors text-sm font-bold text-slate-700"
         >
          {tags.map((tag) => (
           <option key={tag} value={tag}>
            {tag}
           </option>
          ))}
         </select>
        </div>

        <div>
         <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">
          Post Title <span className="text-red-500">*</span>
         </label>
         <input
          type="text"
          required
          value={newPost.title}
          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          placeholder="Keep it brief and descriptive..."
          className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors text-sm font-bold text-slate-700"
         />
        </div>

        <div>
         <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">
          Details <span className="text-red-500">*</span>
         </label>
         <textarea
          required
          value={newPost.content}
          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          placeholder="Add context, links, or specific questions here..."
          className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors resize-none h-40 text-sm font-medium text-slate-700"
         />
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
         <button
          type="button"
          onClick={() => setShowNewPostModal(false)}
          className="flex-1 px-4 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
         >
          Cancel
         </button>
         <button
          type="submit"
          className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
         >
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
