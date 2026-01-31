import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Clock, MapPin, User, MessageSquare, Send, ThumbsUp, Moon, Sun, GitMerge, AlertCircle, X } from 'lucide-react';

const IssueDetailPage = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // ID of comment being replied to
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState('');

  const fetchIssueDetails = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/issues/${issueId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch issue');
      
      const data = await response.json();
      setIssue(data);
      setHasUpvoted(data.upvotes?.includes(user?.id) || false);
    } catch (error) {
      toast.error('Failed to load issue details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [issueId, navigate, user?.id]);

  useEffect(() => {
    fetchIssueDetails();
  }, [fetchIssueDetails]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text: comment, 
          parent_comment: replyTo 
        })
      });

      if (!response.ok) throw new Error('Failed to add comment');

      toast.success('Comment added successfully');
      setComment('');
      setReplyTo(null);
      fetchIssueDetails();
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleMergeIssue = async () => {
    if (!mergeTargetId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/issues/${issueId}/merge/${mergeTargetId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to merge issues');

      toast.success('Issues merged successfully');
      setMergeDialogOpen(false);
      navigate('/management/dashboard');
    } catch (error) {
      toast.error('Failed to merge issues');
    }
  };

  const handleUpvote = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/issues/${issueId}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to upvote');

      const data = await response.json();
      setHasUpvoted(data.has_upvoted);
      fetchIssueDetails();
    } catch (error) {
      toast.error('Failed to upvote issue');
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/issues/${issueId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to like comment');

      // Refresh to show new like count
      fetchIssueDetails();
    } catch (error) {
      toast.error('Failed to like comment');
    }
  };

  const getThreadedComments = () => {
    if (!issue.comments) return [];
    const commentMap = {};
    const roots = [];

    // Deep copy to avoid mutating state directly
    const comments = JSON.parse(JSON.stringify(issue.comments));

    comments.forEach(c => {
      commentMap[c.id] = { ...c, replies: [] };
    });

    comments.forEach(c => {
      if (c.parent_comment && commentMap[c.parent_comment]) {
        commentMap[c.parent_comment].replies.push(commentMap[c.id]);
      } else {
        roots.push(commentMap[c.id]);
      }
    });

    return roots;
  };

  const CommentItem = ({ comment, depth = 0 }) => (
    <div className={`border-b border-slate-100 dark:border-slate-700 pb-4 last:border-0 ${depth > 0 ? 'ml-8 mt-3 border-l-2 border-l-slate-200 dark:border-l-slate-700 pl-4 border-b-0' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm dark:text-white">{comment.user_name}</span>
            <Badge variant="outline" className="text-xs dark:text-slate-300 dark:border-slate-600">{comment.user_role}</Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm">{comment.text}</p>
          
          <div className="flex items-center gap-4 mt-2">
            <button 
              onClick={() => handleLikeComment(comment.id)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                comment.likes?.includes(user?.id) 
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' 
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <ThumbsUp className="w-3 h-3" />
              <span>{comment.likes?.length || 0}</span>
            </button>
            <button 
              onClick={() => setReplyTo(comment.id)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              Reply
            </button>
          </div>
        </div>
      </div>
      {/* Render replies recursively */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );

  const getPriorityColor = (priority) => {
    const colors = {
      Emergency: 'bg-red-50 text-red-700 border-red-200',
      High: 'bg-orange-50 text-orange-700 border-orange-200',
      Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      Low: 'bg-blue-50 text-blue-700 border-blue-200'
    };
    return colors[priority] || colors.Medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      Reported: 'bg-slate-100 text-slate-700',
      Assigned: 'bg-blue-100 text-blue-700',
      'In Progress': 'bg-amber-100 text-amber-700',
      Resolved: 'bg-green-100 text-green-700',
      Closed: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors.Reported;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading issue details...</p>
        </div>
      </div>
    );
  }

  if (!issue) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-yellow-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            title="Toggle dark mode"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          {user?.role === 'management' && (
            <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="ml-2">
                  <GitMerge className="w-4 h-4 mr-2" />
                  Merge Issue
                </Button>
              </DialogTrigger>
              <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Merge Issue</DialogTitle>
                  <DialogDescription className="dark:text-slate-400">
                    Merge this issue into another issue. This will close this issue and link it to the target issue.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="dark:text-white">Target Issue ID</Label>
                    <Input 
                      placeholder="Enter target issue ID" 
                      value={mergeTargetId}
                      onChange={(e) => setMergeTargetId(e.target.value)}
                      className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                    />
                  </div>
                  <Button onClick={handleMergeIssue} className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={!mergeTargetId}>
                    Merge Issues
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Duplicate Alert */}
        {issue.is_duplicate && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300">Duplicate Issue</h3>
              <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                This issue has been marked as a duplicate and merged into{' '}
                <Link to={`/student/issues/${issue.merged_with}`} className="underline font-medium hover:text-amber-900 dark:hover:text-amber-200">
                  Issue #{issue.merged_with}
                </Link>
                . Please check the main issue for updates.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Issue Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(issue.priority)}>{issue.priority}</Badge>
                    <Badge className={getStatusColor(issue.status)}>{issue.status}</Badge>
                    <code className="text-xs text-slate-500 dark:text-slate-400 font-mono">{issue.ticket_id}</code>
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-2 dark:text-white">{issue.title}</CardTitle>
                <p className="text-slate-600 dark:text-slate-300">{issue.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <User className="w-4 h-4" />
                      <span>Reporter: {issue.reporter_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>Reported: {new Date(issue.reported_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span>Location: {issue.location.hostel} - {issue.location.block} - {issue.location.room}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      <span>Category: {issue.category}</span>
                    </div>
                  </div>

                  {/* Status History */}
                  {issue.status_history && issue.status_history.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <h3 className="font-semibold text-lg mb-4 dark:text-white">Status History</h3>
                      <div className="space-y-3">
                        {issue.status_history.map((history, index) => (
                          <div key={index} className="flex items-start gap-3 text-sm">
                            <div className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium dark:text-white">{history.updated_by_name}</span>
                                <span className="text-slate-500 dark:text-slate-400">changed status to</span>
                                <Badge className={getStatusColor(history.new_status)} variant="outline">
                                  {history.new_status}
                                </Badge>
                              </div>
                              {history.remarks && (
                                <p className="text-slate-600 dark:text-slate-300 mt-1">{history.remarks}</p>
                              )}
                              <span className="text-xs text-slate-500 dark:text-slate-500">
                                {new Date(history.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <MessageSquare className="w-5 h-5" />
                  Comments ({issue.comments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Existing Comments */}
                <div className="space-y-4 mb-6">
                  {issue.comments && issue.comments.length > 0 ? (
                    getThreadedComments().map((comment) => (
                      <CommentItem key={comment.id} comment={comment} />
                    ))
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">No comments yet</p>
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="space-y-3">
                  {replyTo && (
                    <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-2 rounded-lg text-sm">
                      <span className="text-slate-600 dark:text-slate-300">
                        Replying to comment...
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setReplyTo(null)}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <Textarea
                    placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="resize-none dark:bg-slate-700 dark:text-white dark:border-slate-600"
                  />
                  <Button 
                    type="submit" 
                    disabled={submittingComment || !comment.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submittingComment ? 'Posting...' : replyTo ? 'Post Reply' : 'Post Comment'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Predictions */}
            {issue.ai_predictions && (
              <Card className="bg-gradient-to-br from-indigo-50 dark:from-indigo-900 to-purple-50 dark:to-purple-900 border border-indigo-200 dark:border-indigo-700">
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white">AI Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-300">Predicted Category:</span>
                    <p className="font-medium dark:text-white">{issue.ai_predictions.category}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-300">Predicted Priority:</span>
                    <p className="font-medium dark:text-white">{issue.ai_predictions.priority}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-300">Confidence:</span>
                    <p className="font-medium dark:text-white">{(issue.ai_predictions.confidence_score * 100).toFixed(0)}%</p>
                  </div>
                  {issue.ai_predictions.estimated_resolution_hours && (
                    <div>
                      <span className="text-slate-600 dark:text-slate-300">Est. Resolution:</span>
                      <p className="font-medium dark:text-white">{issue.ai_predictions.estimated_resolution_hours}h</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Issue Info */}
            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Issue Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Visibility:</span>
                  <p className="font-medium dark:text-white">{issue.visibility}</p>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Views:</span>
                  <p className="font-medium dark:text-white">{issue.views}</p>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Support Count:</span>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      onClick={handleUpvote}
                      variant={hasUpvoted ? "default" : "outline"}
                      size="sm"
                      className={hasUpvoted ? "bg-indigo-600 hover:bg-indigo-700" : "dark:text-white dark:border-slate-600 dark:hover:bg-slate-700"}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {issue.upvotes?.length || 0}
                    </Button>
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      {hasUpvoted ? "You find this helpful" : "Mark as helpful"}
                    </span>
                  </div>
                </div>
                {issue.assigned_to_name && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Assigned To:</span>
                    <p className="font-medium dark:text-white">{issue.assigned_to_name}</p>
                  </div>
                )}
                {issue.closed_at && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Closed At:</span>
                    <p className="font-medium dark:text-white">{new Date(issue.closed_at).toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailPage;
