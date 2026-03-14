import { useState } from "react";
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

 // Initial Mock Data with a 'userVote' property to track if the current user has voted
 const [posts, setPosts] = useState([
  {
   id: 1,
   author: "Arjun Mehta",
   title: "Best resources for learning PyTorch?",
   content:
    "Hey everyone! I'm applying for Dr. Sharma's AI research project and want to brush up on PyTorch. Does anyone have good tutorial recommendations or roadmaps?",
   upvotes: 24,
   downvotes: 2,
   userVote: null, // 'up', 'down', or null
   comments: 5,
   tag: "Academics",
   time: "2 hours ago",
  },
  {
   id: 2,
   author: "Priya Das",
   title: "Looking for a frontend developer for Hackathon!",
   content:
    "Our team is building a decentralized supply chain app for the upcoming Web3 hackathon. We need someone good with React and Tailwind. DM me if interested!",
   upvotes: 15,
   downvotes: 0,
   userVote: "up", // Simulating the user already upvoted this
   comments: 8,
   tag: "Projects",
   time: "5 hours ago",
  },
  {
   id: 3,
   author: "Rahul Verma",
   title: "Did anyone understand the Red-Black tree lecture?",
   content:
    "I'm completely lost on the insertion cases we covered today in Data Structures. Would anyone be open to a quick study session in the library tomorrow?",
   upvotes: 42,
   downvotes: 5,
   userVote: null,
   comments: 12,
   tag: "Study Group",
   time: "1 day ago",
  },
 ]);

 // ADVANCED VOTING LOGIC (Ensures 1 vote per user, allows toggling/switching)
 const handleVote = (id, voteType) => {
  setPosts(
   posts.map((post) => {
    if (post.id === id) {
     let newUpvotes = post.upvotes;
     let newDownvotes = post.downvotes;
     let newUserVote = post.userVote;

     // If clicking the same vote again, remove the vote (Toggle off)
     if (post.userVote === voteType) {
      voteType === "up" ? newUpvotes-- : newDownvotes--;
      newUserVote = null;
     }
     // Otherwise, apply the new vote
     else {
      // If they are switching votes, remove the old one first
      if (post.userVote === "up") newUpvotes--;
      if (post.userVote === "down") newDownvotes--;

      // Add the new vote
      voteType === "up" ? newUpvotes++ : newDownvotes++;
      newUserVote = voteType;
     }

     return {
      ...post,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVote: newUserVote,
     };
    }
    return post;
   }),
  );
 };

 const handleCreatePost = (e) => {
  e.preventDefault();
  if (!newPost.title.trim() || !newPost.content.trim()) return;

  const postToAdd = {
   id: Date.now(),
   author: "You", // In a real app, pull from Auth context
   title: newPost.title,
   content: newPost.content,
   upvotes: 1, // Automatically upvote your own post
   downvotes: 0,
   userVote: "up",
   comments: 0,
   tag: newPost.tag,
   time: "Just now",
  };

  setPosts([postToAdd, ...posts]);
  setShowNewPostModal(false);
  setNewPost({ title: "", content: "", tag: "General" });

  // Trigger Toast Notification
  setToastMessage("Your post has been published to the forum!");
  setTimeout(() => setToastMessage(null), 3000);
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
        <div className="flex flex-col items-center gap-1 bg-slate-50 rounded-xl p-2 h-fit border border-slate-100 min-w-[50px]">
         <button
          onClick={() => handleVote(post.id, "up")}
          className={`transition-colors p-1 rounded-md ${post.userVote === "up" ? "text-green-600 bg-green-100" : "text-slate-400 hover:text-green-600 hover:bg-slate-200"}`}
         >
          <ArrowBigUp
           size={24}
           className={post.userVote === "up" ? "fill-green-600" : ""}
          />
         </button>
         <span
          className={`font-black text-sm ${post.userVote === "up" ? "text-green-600" : post.userVote === "down" ? "text-red-600" : "text-slate-700"}`}
         >
          {post.upvotes - post.downvotes}
         </span>
         <button
          onClick={() => handleVote(post.id, "down")}
          className={`transition-colors p-1 rounded-md ${post.userVote === "down" ? "text-red-600 bg-red-100" : "text-slate-400 hover:text-red-600 hover:bg-slate-200"}`}
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
           <UserCircle size={14} className="text-slate-500" /> {post.author}
          </div>
          <div className="flex items-center gap-1">
           <Clock size={14} className="text-slate-500" /> {post.time}
          </div>
          <div className="flex items-center gap-1 hover:text-indigo-600 cursor-pointer transition-colors">
           <MessageSquare size={14} className="text-indigo-500" />{" "}
           {post.comments} Comments
          </div>
         </div>
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
