import { backend } from 'declarations/backend';
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";

let authClient;
let principal;

async function init() {
    authClient = await AuthClient.create();
    if (await authClient.isAuthenticated()) {
        handleAuthenticated();
    }
}

async function handleAuthenticated() {
    principal = await authClient.getIdentity().getPrincipal();
    document.getElementById('loginBtn').textContent = 'Logout';
    loadPosts();
    loadProfile();
}

async function login() {
    if (await authClient.isAuthenticated()) {
        await authClient.logout();
        document.getElementById('loginBtn').textContent = 'Login';
        principal = null;
    } else {
        await authClient.login({
            identityProvider: "https://identity.ic0.app/#authorize",
            onSuccess: handleAuthenticated,
        });
    }
}

async function loadPosts() {
    const posts = await backend.getPosts();
    const postsSection = document.getElementById('posts');
    postsSection.innerHTML = '';
    posts.forEach(post => {
        const article = document.createElement('article');
        article.innerHTML = `
            <h2>${post.title}</h2>
            <p>${post.body}</p>
            <p>By: ${post.authorUsername}</p>
            <p>Posted: ${new Date(Number(post.timestamp) / 1000000).toLocaleString()}</p>
        `;
        postsSection.appendChild(article);
    });
}

async function createPost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    await backend.createPost(title, content);
    document.getElementById('newPostForm').style.display = 'none';
    loadPosts();
}

async function loadProfile() {
    try {
        const result = await backend.getProfile();
        if ('ok' in result) {
            const profile = result.ok;
            document.getElementById('username').value = profile.username;
            document.getElementById('bio').value = profile.bio;
        } else {
            console.error('Failed to load profile:', result.err);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function updateProfile(event) {
    event.preventDefault();
    try {
        const username = document.getElementById('username').value;
        const bio = document.getElementById('bio').value;
        const pictureInput = document.getElementById('profilePicture');
        let picture = [];
        if (pictureInput.files.length > 0) {
            const file = pictureInput.files[0];
            const arrayBuffer = await file.arrayBuffer();
            picture = Array.from(new Uint8Array(arrayBuffer));
        }
        await backend.updateProfile(username, bio, picture.length > 0 ? picture : null);
        console.log('Profile updated successfully');
        loadProfile();
    } catch (error) {
        console.error('Error updating profile:', error);
    }
}

document.getElementById('loginBtn').onclick = login;
document.getElementById('homeBtn').onclick = loadPosts;
document.getElementById('profileBtn').onclick = () => {
    document.getElementById('profileSection').style.display = 'block';
    document.getElementById('posts').style.display = 'none';
    document.getElementById('newPostForm').style.display = 'none';
};
document.getElementById('newPostBtn').onclick = () => {
    document.getElementById('newPostForm').style.display = 'block';
};
document.getElementById('submitPost').onclick = createPost;
document.getElementById('profileForm').onsubmit = updateProfile;

init();
