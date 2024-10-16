import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Post {
  'id' : bigint,
  'title' : string,
  'authorUsername' : string,
  'body' : string,
  'timestamp' : Time,
}
export interface Profile {
  'bio' : string,
  'username' : string,
  'picture' : [] | [Uint8Array | number[]],
}
export type Result = { 'ok' : Profile } |
  { 'err' : string };
export type Time = bigint;
export interface _SERVICE {
  'createPost' : ActorMethod<[string, string], bigint>,
  'getPosts' : ActorMethod<[], Array<Post>>,
  'getProfile' : ActorMethod<[], Result>,
  'updateProfile' : ActorMethod<
    [string, string, [] | [Uint8Array | number[]]],
    undefined
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
