import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "declarations/backend/backend.did.js";
import { canisterId } from "declarations/backend/index.js";

let authClient;
let quill;
let authenticatedBackend;

const loginBtn = document.getElementById("loginBtn");
const newPostBtn = document.getElementById("newPostBtn");
const newPostForm = document.getElementById("newPostForm");
const postTitle = document.getElementById("postTitle");
const submitPost = document.getElementById("submitPost");
const postsSection = document.getElementById("posts");
const homeBtn = document.getElementById("homeBtn");
const profileBtn = document.getElementById("profileBtn");
const profileSection = document.getElementById("profileSection");
const profileForm = document.getElementById("profileForm");

async function init() {
  authClient = await AuthClient.create();
  if (await authClient.isAuthenticated()) {
    loginBtn.textContent = "Logout";
    await setupAuthenticatedBackend();
  }

  quill = new Quill('#editor', {
    theme: 'snow'
  });

  loginBtn.onclick = login;
  newPostBtn.onclick = toggleNewPostForm;
  submitPost.onclick = createPost;
  homeBtn.onclick = showHome;
  profileBtn.onclick = showProfile;
  profileForm.onsubmit = updateProfile;

  await refreshPosts();
}

async function setupAuthenticatedBackend() {
  const identity = await authClient.getIdentity();
  const agent = new HttpAgent({ identity });
  authenticatedBackend = Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
}

async function login() {
  if (await authClient.isAuthenticated()) {
    await authClient.logout();
    loginBtn.textContent = "Login";
    authenticatedBackend = null;
  } else {
    await authClient.login({
      identityProvider: "https://identity.ic0.app/#authorize",
      onSuccess: async () => {
        loginBtn.textContent = "Logout";
        await setupAuthenticatedBackend();
      }
    });
  }
}

function toggleNewPostForm() {
  newPostForm.style.display = newPostForm.style.display === "none" ? "block" : "none";
}

async function createPost() {
  if (!authenticatedBackend) {
    alert("Please login to create a post");
    return;
  }

  const title = postTitle.value;
  const body = quill.root.innerHTML;

  if (!title || !body) {
    alert("Please fill in both title and body");
    return;
  }

  submitPost.disabled = true;
  submitPost.textContent = "Submitting...";

  try {
    const result = await authenticatedBackend.createPost(title, body);
    if ('ok' in result) {
      alert("Post created successfully!");
      postTitle.value = "";
      quill.setContents([]);
      toggleNewPostForm();
      await refreshPosts();
    } else {
      alert("Error creating post: " + result.err);
    }
  } catch (error) {
    console.error("Error creating post:", error);
    alert("An error occurred while creating the post");
  } finally {
    submitPost.disabled = false;
    submitPost.textContent = "Submit Post";
  }
}

async function refreshPosts() {
  const posts = await authenticatedBackend.getPosts();
  postsSection.innerHTML = "";
  posts.forEach(post => {
    const postElement = document.createElement("article");
    postElement.innerHTML = `
      <h2>${post.title}</h2>
      <p>By ${post.author}</p>
      <div>${post.body}</div>
      <small>${new Date(Number(post.timestamp) / 1000000).toLocaleString()}</small>
    `;
    postsSection.appendChild(postElement);
  });
}

function showHome() {
  postsSection.style.display = "block";
  newPostBtn.style.display = "block";
  profileSection.style.display = "none";
}

async function showProfile() {
  if (!authenticatedBackend) {
    alert("Please login to view your profile");
    return;
  }

  postsSection.style.display = "none";
  newPostBtn.style.display = "none";
  profileSection.style.display = "block";

  try {
    const result = await authenticatedBackend.getProfile();
    if ('ok' in result) {
      document.getElementById("username").value = result.ok.username;
      document.getElementById("bio").value = result.ok.bio;
    } else {
      console.error("Error fetching profile:", result.err);
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
  }
}

async function updateProfile(event) {
  event.preventDefault();

  if (!authenticatedBackend) {
    alert("Please login to update your profile");
    return;
  }

  const username = document.getElementById("username").value;
  const bio = document.getElementById("bio").value;
  const pictureInput = document.getElementById("profilePicture");
  
  let picture = null;
  if (pictureInput.files.length > 0) {
    const file = pictureInput.files[0];
    picture = await file.arrayBuffer();
  }

  try {
    const result = await authenticatedBackend.updateProfile(username, bio, picture);
    if ('ok' in result) {
      alert("Profile updated successfully!");
    } else {
      alert("Error updating profile: " + result.err);
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    alert("An error occurred while updating the profile");
  }
}

init();
