import Int "mo:base/Int";
import Nat "mo:base/Nat";

import Array "mo:base/Array";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Blob "mo:base/Blob";

actor {
  type Post = {
    id: Nat;
    title: Text;
    body: Text;
    author: Principal;
    timestamp: Int;
  };

  type Profile = {
    username: Text;
    bio: Text;
    picture: ?Blob;
  };

  stable var posts : [Post] = [];
  stable var nextId : Nat = 0;
  stable var profiles : [(Principal, Profile)] = [];

  public shared(msg) func createPost(title: Text, body: Text) : async Result.Result<(), Text> {
    if (Principal.isAnonymous(msg.caller)) {
      return #err("You must be logged in to create a post");
    };

    let post : Post = {
      id = nextId;
      title = title;
      body = body;
      author = msg.caller;
      timestamp = Time.now();
    };

    posts := Array.append(posts, [post]);
    nextId += 1;
    #ok(())
  };

  public query func getPosts() : async [Post] {
    Array.reverse(posts)
  };

  public shared(msg) func updateProfile(username: Text, bio: Text, picture: ?Blob) : async Result.Result<(), Text> {
    if (Principal.isAnonymous(msg.caller)) {
      return #err("You must be logged in to update your profile");
    };

    let profile : Profile = {
      username = username;
      bio = bio;
      picture = picture;
    };

    let index = Array.indexOf<(Principal, Profile)>((msg.caller, profile), profiles, func((p1, _), (p2, _)) { p1 == p2 });
    switch (index) {
      case (null) { profiles := Array.append(profiles, [(msg.caller, profile)]); };
      case (?i) { profiles := Array.tabulate<(Principal, Profile)>(profiles.size(), func(j) {
        if (j == i) { (msg.caller, profile) } else { profiles[j] }
      }); };
    };

    #ok(())
  };

  public query(msg) func getProfile() : async Result.Result<Profile, Text> {
    if (Principal.isAnonymous(msg.caller)) {
      return #err("You must be logged in to view your profile");
    };

    let index = Array.indexOf<(Principal, Profile)>((msg.caller, { username = ""; bio = ""; picture = null }), profiles, func((p1, _), (p2, _)) { p1 == p2 });
    switch (index) {
      case (null) { #err("Profile not found") };
      case (?i) { #ok(profiles[i].1) };
    }
  };

  public query func getProfileByPrincipal(p: Principal) : async Result.Result<Profile, Text> {
    let index = Array.indexOf<(Principal, Profile)>((p, { username = ""; bio = ""; picture = null }), profiles, func((p1, _), (p2, _)) { p1 == p2 });
    switch (index) {
      case (null) { #err("Profile not found") };
      case (?i) { #ok(profiles[i].1) };
    }
  };
}
