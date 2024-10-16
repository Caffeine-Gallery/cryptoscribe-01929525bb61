import { AuthClient } from "@dfinity/auth-client";
import { backend } from "declarations/backend";

let authClient;
let quill;

const loginBtn = document.getElementById("loginBtn");
const newPostBtn = document.getElementById("newPostBtn");
const newPostForm = document.getElementById("newPostForm");
const postTitle = document.getElementById("postTitle");
const submitPost = document.getElementById("submitPost");
const postsSection = document.getElementById("posts");

async function init() {
  authClient = await AuthClient.create();
  if (await authClient.isAuthenticated()) {
    loginBtn.textContent = "Logout";
  }

  quill = new Quill('#editor', {
    theme: 'snow'
  });

  loginBtn.onclick = login;
  newPostBtn.onclick = toggleNewPostForm;
  submitPost.onclick = createPost;

  await refreshPosts();
}

async function login() {
  if (await authClient.isAuthenticated()) {
    await authClient.logout();
    loginBtn.textContent = "Login";
  } else {
    await authClient.login({
      identityProvider: "https://identity.ic0.app/#authorize",
      onSuccess: () => {
        loginBtn.textContent = "Logout";
      }
    });
  }
}

function toggleNewPostForm() {
  newPostForm.style.display = newPostForm.style.display === "none" ? "block" : "none";
}

async function createPost() {
  if (!(await authClient.isAuthenticated())) {
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
    const result = await backend.createPost(title, body);
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
  const posts = await backend.getPosts();
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

init();
