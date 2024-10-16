import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Text "mo:base/Text";

import Array "mo:base/Array";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Result "mo:base/Result";

actor {
  type Post = {
    id: Nat;
    title: Text;
    body: Text;
    author: Text;
    timestamp: Int;
  };

  stable var posts : [Post] = [];
  stable var nextId : Nat = 0;

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
}
