import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../ToastContext';
import type { Comment } from '../../pages/types';

const COMMENT_PREVIEW_COUNT = 5;

interface CommentSectionProps {
  shortcutId: number;
  status: string;
}

interface ReplyTarget {
  id: number;
  username: string;
}

function flattenReplies(replies: Comment[]): Comment[] {
  const result: Comment[] = [];
  for (const r of replies) {
    result.push(r);
    if (r.replies && r.replies.length > 0) {
      result.push(...flattenReplies(r.replies));
    }
  }
  return result;
}

function AvatarImg({ src, name, theme, size }: { src?: string; name: string; theme: string; size: string }) {
  if (src) {
    return <img src={src} className={`${size} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${size} rounded-full flex items-center justify-center text-white shrink-0 font-medium`} style={{ backgroundColor: theme, fontSize: size === 'w-8 h-8' ? '14px' : '11px' }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function InlineReplyForm({
  target,
  replyText,
  replyLoading,
  onReplyTextChange,
  onSubmitReply,
  onCancel,
}: {
  target: ReplyTarget;
  replyText: string;
  replyLoading: boolean;
  onReplyTextChange: (text: string) => void;
  onSubmitReply: (parentId: number) => void;
  onCancel: () => void;
}) {
  return (
    <div className="ml-11 mt-2 mb-1">
      <textarea
        value={replyText}
        onChange={e => onReplyTextChange(e.target.value)}
        placeholder={`回复 @${target.username}...`}
        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
        rows={2}
      />
      <div className="flex justify-end gap-2 mt-1.5">
        <button onClick={onCancel} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700">取消</button>
        <button onClick={() => onSubmitReply(target.id)} disabled={replyLoading || !replyText.trim()} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
          {replyLoading ? '提交中...' : '回复'}
        </button>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  theme: string;
  user: { id: number; role?: string } | null;
  replyTo: ReplyTarget | null;
  replyText: string;
  replyLoading: boolean;
  commentMap: Record<number, Comment>;
  expandedReplies: Set<number>;
  onToggleReplies: () => void;
  onReply: (target: ReplyTarget | null) => void;
  onReplyTextChange: (text: string) => void;
  onSubmitReply: (parentId: number) => void;
  onDelete: (commentId: number) => void;
}

function CommentItem({
  comment,
  theme,
  user,
  replyTo,
  replyText,
  replyLoading,
  commentMap,
  expandedReplies,
  onToggleReplies,
  onReply,
  onReplyTextChange,
  onSubmitReply,
  onDelete,
}: CommentItemProps) {
  const flatReplies = useMemo(() =>
    comment.replies ? flattenReplies(comment.replies) : [],
    [comment.replies]
  );

  return (
    <div>
      <div className="flex gap-3">
        <Link to={`/user/${comment.user_id}`} className="shrink-0">
          <AvatarImg src={comment.avatar} name={comment.username} theme={theme} size="w-8 h-8" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link to={`/user/${comment.user_id}`} className="text-sm font-medium text-gray-800 hover:text-blue-600">{comment.username}</Link>
            <span className="text-xs text-gray-400">
              {new Date(comment.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-0.5 break-words">{comment.content}</p>
          <div className="flex items-center gap-3 mt-1">
            {user && (
              <button
                onClick={() => onReply(replyTo?.id === comment.id ? null : { id: comment.id, username: comment.username })}
                className="text-xs text-gray-400 hover:text-blue-500"
              >
                回复
              </button>
            )}
            {user?.id === comment.user_id && (
              <button onClick={() => onDelete(comment.id)} className="text-xs text-gray-400 hover:text-red-500">删除</button>
            )}
          </div>
        </div>
      </div>

      {replyTo?.id === comment.id && (
        <InlineReplyForm
          target={replyTo}
          replyText={replyText}
          replyLoading={replyLoading}
          onReplyTextChange={onReplyTextChange}
          onSubmitReply={onSubmitReply}
          onCancel={() => onReply(null)}
        />
      )}

      {flatReplies.length > 0 && (
        <div className="ml-11 mt-1.5">
          <button
            onClick={onToggleReplies}
            className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 mb-1"
          >
            <svg className={`w-3 h-3 transition-transform ${expandedReplies.has(comment.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {expandedReplies.has(comment.id) ? '收起' : '展开'} {flatReplies.length} 条回复
          </button>
          {expandedReplies.has(comment.id) && (
            <div className="mt-2 space-y-2.5">
              {flatReplies.map(r => {
            const replyParentUsername = r.parent_id ? commentMap[r.parent_id]?.username : null;
            return (
              <div key={r.id}>
                <div className="flex gap-2.5">
                  <Link to={`/user/${r.user_id}`} className="shrink-0">
                    <AvatarImg src={r.avatar} name={r.username} theme={theme} size="w-6 h-6" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap leading-tight">
                      <Link to={`/user/${r.user_id}`} className="text-xs font-medium text-gray-800 hover:text-blue-600">{r.username}</Link>
                      {replyParentUsername && (
                        <>
                          <span className="text-xs text-gray-400">回复</span>
                          <span className="text-xs text-blue-500">@{replyParentUsername}</span>
                        </>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5 break-words">{r.content}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {user && (
                        <button
                          onClick={() => onReply(replyTo?.id === r.id ? null : { id: r.id, username: r.username })}
                          className="text-xs text-gray-400 hover:text-blue-500"
                        >
                          回复
                        </button>
                      )}
                      {user?.id === r.user_id && (
                        <button onClick={() => onDelete(r.id)} className="text-xs text-gray-400 hover:text-red-500">删除</button>
                      )}
                    </div>
                  </div>
                </div>
                {replyTo?.id === r.id && (
                  <InlineReplyForm
                    target={replyTo}
                    replyText={replyText}
                    replyLoading={replyLoading}
                    onReplyTextChange={onReplyTextChange}
                    onSubmitReply={onSubmitReply}
                    onCancel={() => onReply(null)}
                  />
                )}
              </div>
            );
          })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ shortcutId, status }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast, confirm } = useToast();

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getComments(shortcutId)
      .then((data) => {
        if (cancelled) return;
        setComments(data.comments);
        setCommentCount(data.comments.length);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [shortcutId]);

  const { commentTree, commentMap } = useMemo(() => {
    const map: Record<number, Comment> = {};
    const roots: Comment[] = [];
    for (const c of comments) {
      map[c.id] = { ...c, replies: [] };
    }
    for (const c of comments) {
      const node = map[c.id];
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies!.push(node);
      } else {
        roots.push(node);
      }
    }
    return { commentTree: roots, commentMap: map };
  }, [comments]);

  const theme = '#3B82F6';

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast('请先登录后再评论', 'info');
      return;
    }
    if (!commentText.trim()) return;

    setCommentLoading(true);
    try {
      const data = await api.addComment(shortcutId, commentText.trim());
      setComments(prev => [data.comment, ...prev]);
      setCommentCount(prev => prev + 1);
      setCommentText('');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setCommentLoading(false);
    }
  };

  const toggleReplies = (commentId: number) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleReply = async (parentId: number) => {
    if (!user) {
      toast('请先登录后再评论', 'info');
      return;
    }
    if (!replyText.trim()) return;

    setReplyLoading(true);
    try {
      const data = await api.addComment(shortcutId, replyText.trim(), parentId);
      setComments(prev => [data.comment, ...prev]);
      setCommentCount(prev => prev + 1);
      setReplyText('');
      setReplyTo(null);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!(await confirm('确定要删除该评论吗？'))) return;
    try {
      const data = await api.deleteComment(shortcutId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId));
      setCommentCount(prev => prev - (1 + (data.deleted_replies || 0)));
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 text-center text-gray-400 text-sm">
        加载评论中...
      </div>
    );
  }

  if (status === 'removed') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm mb-6">
        该分享已被下架，评论功能已关闭
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        评论 ({commentCount})
      </h2>

      {user ? (
        <form onSubmit={handleComment} className="mb-6">
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="写下你的评论..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={commentLoading || !commentText.trim()}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {commentLoading ? '提交中...' : '发表评论'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-500 text-center">
          请
          <Link to="/login" className="text-blue-600 hover:underline mx-1">登录</Link>
          后发表评论
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-4">暂无评论</p>
      ) : (
        <div className="space-y-4">
          {(showAllComments ? commentTree : commentTree.slice(0, COMMENT_PREVIEW_COUNT)).map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              theme={theme}
              user={user}
              replyTo={replyTo}
              replyText={replyText}
              replyLoading={replyLoading}
              commentMap={commentMap}
              expandedReplies={expandedReplies}
              onToggleReplies={() => toggleReplies(c.id)}
              onReply={(target) => { setReplyTo(target); if (!target) setReplyText(''); }}
              onReplyTextChange={setReplyText}
              onSubmitReply={handleReply}
              onDelete={handleDeleteComment}
            />
          ))}
          {!showAllComments && commentTree.length > COMMENT_PREVIEW_COUNT && (
            <button
              onClick={() => setShowAllComments(true)}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2"
            >
              展开剩余 {commentTree.length - COMMENT_PREVIEW_COUNT} 条评论
            </button>
          )}
          {showAllComments && commentTree.length > COMMENT_PREVIEW_COUNT && (
            <button
              onClick={() => setShowAllComments(false)}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              收起评论
            </button>
          )}
        </div>
      )}
    </div>
  );
}
