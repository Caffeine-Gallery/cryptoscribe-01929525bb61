import Hash "mo:base/Hash";
import Int "mo:base/Int";
import Nat "mo:base/Nat";

import Array "mo:base/Array";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Blob "mo:base/Blob";

actor {
  type Post = {
    id: Nat;
    title: Text;
    body: Text;
    author: Text;
    timestamp: Int;
  };

  type Profile = {
    username: Text;
    bio: Text;
    picture: ?Blob;
  };

  stable var posts : [Post] = [];
  stable var nextId : Nat = 0;
  stable var profileEntries : [(Principal, Profile)] = [];
  let profiles = HashMap.fromIter<Principal, Profile>(profileEntries.vals(), 10, Principal.equal, Principal.hash);

  public shared(msg) func createPost(title: Text, body: Text) : async Result.Result<(), Text> {
    let caller = Principal.toText(msg.caller);
    if (Principal.isAnonymous(msg.caller)) {
      return #err("You must be logged in to create a post");
    };

    let post : Post = {
      id = nextId;
      title = title;
      body = body;
      author = caller;
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

    profiles.put(msg.caller, profile);
    #ok(())
  };

  public query(msg) func getProfile() : async Result.Result<Profile, Text> {
    if (Principal.isAnonymous(msg.caller)) {
      return #err("You must be logged in to view your profile");
    };

    switch (profiles.get(msg.caller)) {
      case (null) {
        #err("Profile not found")
      };
      case (?profile) {
        #ok(profile)
      };
    }
  };

  system func preupgrade() {
    profileEntries := Iter.toArray(profiles.entries());
  };

  system func postupgrade() {
    profileEntries := [];
  };
}
