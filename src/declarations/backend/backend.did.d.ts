import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Post {
  'id' : bigint,
  'title' : string,
  'authorUsername' : string,
  'body' : string,
  'author' : Principal,
  'timestamp' : bigint,
}
export interface Profile {
  'bio' : string,
  'username' : string,
  'picture' : [] | [Uint8Array | number[]],
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : Profile } |
  { 'err' : string };
export interface _SERVICE {
  'createPost' : ActorMethod<[string, string], Result>,
  'getPosts' : ActorMethod<[], Array<Post>>,
  'getProfile' : ActorMethod<[], Result_1>,
  'updateProfile' : ActorMethod<
    [string, string, [] | [Uint8Array | number[]]],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
