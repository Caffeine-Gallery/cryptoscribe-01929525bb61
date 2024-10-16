export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Post = IDL.Record({
    'id' : IDL.Nat,
    'title' : IDL.Text,
    'body' : IDL.Text,
    'author' : IDL.Text,
    'timestamp' : IDL.Int,
  });
  const Profile = IDL.Record({
    'bio' : IDL.Text,
    'username' : IDL.Text,
    'picture' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const Result_1 = IDL.Variant({ 'ok' : Profile, 'err' : IDL.Text });
  return IDL.Service({
    'createPost' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'getPosts' : IDL.Func([], [IDL.Vec(Post)], ['query']),
    'getProfile' : IDL.Func([], [Result_1], ['query']),
    'updateProfile' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Opt(IDL.Vec(IDL.Nat8))],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
