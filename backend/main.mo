import Hash "mo:base/Hash";
import Nat8 "mo:base/Nat8";

import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";

actor {
    type Post = {
        id: Nat;
        title: Text;
        body: Text;
        authorUsername: Text;
        timestamp: Time.Time;
    };

    type Profile = {
        username: Text;
        bio: Text;
        picture: ?Blob;
    };

    private stable var nextPostId : Nat = 0;
    private stable var postEntries : [(Nat, Post)] = [];
    private var posts = HashMap.HashMap<Nat, Post>(0, Nat.equal, Nat.hash);

    private stable var profileEntries : [(Principal, Profile)] = [];
    private var profiles = HashMap.HashMap<Principal, Profile>(0, Principal.equal, Principal.hash);

    system func preupgrade() {
        postEntries := Iter.toArray(posts.entries());
        profileEntries := Iter.toArray(profiles.entries());
    };

    system func postupgrade() {
        posts := HashMap.fromIter<Nat, Post>(postEntries.vals(), 0, Nat.equal, Nat.hash);
        profiles := HashMap.fromIter<Principal, Profile>(profileEntries.vals(), 0, Principal.equal, Principal.hash);
    };

    public shared(msg) func createPost(title: Text, body: Text) : async Nat {
        let authorUsername = switch (profiles.get(msg.caller)) {
            case (null) { "Anonymous" };
            case (?profile) { profile.username };
        };

        let post : Post = {
            id = nextPostId;
            title = title;
            body = body;
            authorUsername = authorUsername;
            timestamp = Time.now();
        };

        posts.put(nextPostId, post);
        nextPostId += 1;
        nextPostId - 1
    };

    public query func getPosts() : async [Post] {
        Iter.toArray(posts.vals())
    };

    public shared(msg) func updateProfile(username: Text, bio: Text, picture: ?[Nat8]) : async () {
        let profile : Profile = {
            username = username;
            bio = bio;
            picture = Option.map(picture, Blob.fromArray);
        };
        profiles.put(msg.caller, profile);
    };

    public shared(msg) func getProfile() : async Result.Result<Profile, Text> {
        switch (profiles.get(msg.caller)) {
            case (null) { #err("Profile not found") };
            case (?profile) { #ok(profile) };
        }
    };
}
