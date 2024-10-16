export const idlFactory = ({ IDL }) => {
  const Time = IDL.Int;
  const Post = IDL.Record({
    'id' : IDL.Nat,
    'title' : IDL.Text,
    'authorUsername' : IDL.Text,
    'body' : IDL.Text,
    'timestamp' : Time,
  });
  const Profile = IDL.Record({
    'bio' : IDL.Text,
    'username' : IDL.Text,
    'picture' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const Result = IDL.Variant({ 'ok' : Profile, 'err' : IDL.Text });
  return IDL.Service({
    'createPost' : IDL.Func([IDL.Text, IDL.Text], [IDL.Nat], []),
    'getPosts' : IDL.Func([], [IDL.Vec(Post)], ['query']),
    'getProfile' : IDL.Func([], [Result], []),
    'updateProfile' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Opt(IDL.Vec(IDL.Nat8))],
        [],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
