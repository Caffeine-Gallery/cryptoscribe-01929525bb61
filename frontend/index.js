import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { idlFactory } from "declarations/backend/backend.did.js";
import { canisterId } from "declarations/backend/index.js";

let authClient;
let quill;
let authenticatedBackend;
let anonymousBackend;

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
const userProfileSection = document.getElementById("userProfileSection");

async function init() {
  authClient = await AuthClient.create();
  await setupAnonymousBackend();
  
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

async function setupAnonymousBackend() {
  const agent = new HttpAgent();
  anonymousBackend = Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
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
  try {
    const posts = await anonymousBackend.getPosts();
    postsSection.innerHTML = "";
    posts.forEach(post => {
      const postElement = document.createElement("article");
      postElement.innerHTML = `
        <h2>${post.title}</h2>
        <p>By <a href="#" class="author-link" data-principal="${post.author.toText()}">${post.authorUsername || 'Anonymous'}</a></p>
        <div>${post.body}</div>
        <small>${new Date(Number(post.timestamp) / 1000000).toLocaleString()}</small>
      `;
      postsSection.appendChild(postElement);
    });

    // Add event listeners to author links
    document.querySelectorAll('.author-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const principal = e.target.dataset.principal;
        showUserProfile(Principal.fromText(principal));
      });
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    postsSection.innerHTML = "<p>An error occurred while fetching posts.</p>";
  }
}

function showHome() {
  postsSection.style.display = "block";
  newPostBtn.style.display = "block";
  profileSection.style.display = "none";
  userProfileSection.style.display = "none";
}

async function showProfile() {
  if (!authenticatedBackend) {
    alert("Please login to view your profile");
    return;
  }

  postsSection.style.display = "none";
  newPostBtn.style.display = "none";
  profileSection.style.display = "block";
  userProfileSection.style.display = "none";

  try {
    const result = await authenticatedBackend.getProfile();
    if ('ok' in result) {
      document.getElementById("username").value = result.ok.username;
      document.getElementById("bio").value = result.ok.bio;
    } else if (result.err === "Profile not found") {
      // Create a default profile if it doesn't exist
      await createDefaultProfile();
      document.getElementById("username").value = "";
      document.getElementById("bio").value = "";
    } else {
      console.error("Error fetching profile:", result.err);
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
  }
}

async function createDefaultProfile() {
  try {
    await authenticatedBackend.updateProfile("", "", []);
  } catch (error) {
    console.error("Error creating default profile:", error);
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
  
  let picture = [];
  if (pictureInput.files.length > 0) {
    const file = pictureInput.files[0];
    picture = new Uint8Array(await file.arrayBuffer());
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

async function showUserProfile(principal) {
  postsSection.style.display = "none";
  newPostBtn.style.display = "none";
  profileSection.style.display = "none";
  userProfileSection.style.display = "block";

  try {
    const result = await anonymousBackend.getProfileByPrincipal(principal);
    if ('ok' in result) {
      document.getElementById("userProfileUsername").textContent = result.ok.username || 'Anonymous';
      document.getElementById("userProfileBio").textContent = result.ok.bio;
      const profilePicture = document.getElementById("userProfilePicture");
      if (result.ok.picture && result.ok.picture.length > 0) {
        profilePicture.src = URL.createObjectURL(new Blob([result.ok.picture]));
        profilePicture.style.display = "block";
      } else {
        profilePicture.style.display = "none";
      }
    } else {
      console.error("Error fetching user profile:", result.err);
      userProfileSection.innerHTML = "<p>User profile not found.</p>";
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    userProfileSection.innerHTML = "<p>An error occurred while fetching the user profile.</p>";
  }
}

init();
