import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getIssues, createIssue, getAnnouncements, getPolls, votePoll } from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Plus, AlertCircle, Clock, CheckCircle, LogOut, MessageSquare, Bell, Home, Moon, Sun, Siren, Utensils, Timer, ShoppingBag, Search, Ticket, Vote } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [issues, setIssues] = useState([]);
  const [polls, setPolls] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);

  const handleSOS = async () => {
    if (!window.confirm("Are you sure you want to trigger an SOS Emergency Alert?")) return;
    
    setSosLoading(true);
    try {
      await createIssue({
        title: "EMERGENCY SOS ALERT",
        description: `Emergency alert triggered by ${user.name} from ${user.hostel} ${user.block} ${user.room}`,
        category: "Security",
        priority: "Emergency",
        visibility: "Public"
      });
      toast.error('SOS ALERT SENT! Help is on the way!', { duration: 5000 });
      fetchData();
    } catch (error) {
      toast.error('Failed to send SOS alert');
    } finally {
      setSosLoading(false);
    }
  };
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    category: 'Plumbing',
    priority: 'Medium',
    visibility: 'Public'
  });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [viewAnnouncementOpen, setViewAnnouncementOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [issuesData, announcementsData, pollsData] = await Promise.all([
        getIssues(),
        getAnnouncements(),
        getPolls()
      ]);
      setIssues(issuesData);
      setAnnouncements(announcementsData);
      setPolls(pollsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionId) => {
    try {
      await votePoll(pollId, optionId);
      toast.success('Vote submitted!');
      const pollsData = await getPolls();
      setPolls(pollsData);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit vote');
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    
    try {
      await createIssue(newIssue);
      // Show success message after API call succeeds
      toast.success('Issue submitted successfully!');
      setNewIssue({
        title: '',
        description: '',
        category: 'Plumbing',
        priority: 'Medium',
        visibility: 'Public'
      });
      setCreateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save issue, please try again');
    }
  };

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10" data-testid="dashboard-header">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Welcome, {user?.name}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">{user?.hostel}-{user?.block}-{user?.room}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSOS}
              disabled={sosLoading}
              className="bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-lg shadow-red-500/50"
              title="Emergency SOS Alert"
            >
              <Siren className="w-4 h-4 mr-2" />
              {sosLoading ? 'Sending...' : 'SOS'}
            </Button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-yellow-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              title="Toggle dark mode"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/student/ai-assistant">
              <Button variant="outline" size="sm" data-testid="ai-assistant-button">
                <MessageSquare className="w-4 h-4 mr-2" />
                AI Assistant
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={logout} data-testid="logout-button">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8" data-testid="student-dashboard">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          {/* Quick Services Links */}
          <Link to="/student/mess">
            <Card className="hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-3">
                  <Utensils className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Mess Menu</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Vote & View</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/student/laundry">
            <Card className="hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3">
                  <Timer className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Laundry</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Check Availability</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/student/marketplace">
            <Card className="hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-3">
                  <ShoppingBag className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Marketplace</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Buy & Sell</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/student/lost-found">
            <Card className="hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-3">
                  <Search className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Lost & Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Report Items</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/student/gatepass">
            <Card className="hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900 rounded-full flex items-center justify-center mb-3">
                  <Ticket className="w-6 h-6 text-rose-600 dark:text-rose-300" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Gate Pass</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Apply for Leave</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{issues.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-500">
                {issues.filter(i => ['Reported', 'Assigned', 'In Progress'].includes(i.status)).length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-500">
                {issues.filter(i => i.status === 'Resolved').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{announcements.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issues Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Issues</h2>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="create-issue-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Issue
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" data-testid="create-issue-dialog">
                  <DialogHeader>
                    <DialogTitle>Report New Issue</DialogTitle>
                    <DialogDescription>Fill in the details of the issue you're facing</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateIssue} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        data-testid="issue-title-input"
                        placeholder="Brief description of the issue"
                        value={newIssue.title}
                        onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        data-testid="issue-description-input"
                        placeholder="Detailed description of the issue"
                        rows={4}
                        value={newIssue.description}
                        onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={newIssue.category} onValueChange={(value) => setNewIssue({ ...newIssue, category: value })}>
                          <SelectTrigger data-testid="issue-category-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Plumbing">Plumbing</SelectItem>
                            <SelectItem value="Electrical">Electrical</SelectItem>
                            <SelectItem value="Cleanliness">Cleanliness</SelectItem>
                            <SelectItem value="Internet">Internet</SelectItem>
                            <SelectItem value="Furniture">Furniture</SelectItem>
                            <SelectItem value="Security">Security</SelectItem>
                            <SelectItem value="Others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={newIssue.priority} onValueChange={(value) => setNewIssue({ ...newIssue, priority: value })}>
                          <SelectTrigger data-testid="issue-priority-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" data-testid="submit-issue-button">
                      Submit Issue
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {issues.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">No issues reported yet</p>
                  </CardContent>
                </Card>
              ) : (
                issues.map((issue) => (
                  <Card key={issue.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all" data-testid={`issue-card-${issue.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getPriorityColor(issue.priority)}>{issue.priority}</Badge>
                            <Badge className={getStatusColor(issue.status)}>{issue.status}</Badge>
                            <code className="text-xs text-slate-500 dark:text-slate-400 font-mono">{issue.ticket_id}</code>
                          </div>
                          <CardTitle className="text-lg font-semibold mb-1 dark:text-white">{issue.title}</CardTitle>
                          <CardDescription className="dark:text-slate-400">{issue.description.substring(0, 100)}...</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(issue.reported_at).toLocaleDateString()}
                          </span>
                          <span>Category: {issue.category}</span>
                        </div>
                        <Link to={`/student/issues/${issue.id}`}>
                          <Button variant="outline" size="sm" data-testid={`view-issue-${issue.id}`}>View Details</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Announcements & Polls Sidebar */}
          <div className="space-y-6">
            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Vote className="w-5 h-5" />
                  Active Polls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {polls.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">No active polls</p>
                ) : (
                  polls.map((poll) => (
                    <div key={poll.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0 pb-4 last:pb-0">
                      <h4 className="font-semibold text-sm mb-3 dark:text-white">{poll.question}</h4>
                      <div className="space-y-2">
                        {poll.options.map((option) => {
                          const percentage = poll.total_votes > 0 ? Math.round((option.votes / poll.total_votes) * 100) : 0;
                          const hasVoted = poll.voters && poll.voters[user.id] === option.id;
                          return (
                            <div key={option.id} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="dark:text-slate-300">{option.text}</span>
                                <span className="font-medium dark:text-slate-300">{percentage}%</span>
                              </div>
                              <div className="relative h-8 w-full bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden cursor-pointer" onClick={() => handleVote(poll.id, option.id)}>
                                <div 
                                  className={`absolute top-0 left-0 h-full transition-all duration-500 ${hasVoted ? 'bg-indigo-500' : 'bg-indigo-200 dark:bg-indigo-900'}`}
                                  style={{ width: `${percentage}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium z-10">
                                  {hasVoted ? 'Voted' : 'Vote'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 text-xs text-slate-500 text-right">{poll.total_votes} votes</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Bell className="w-5 h-5" />
                  Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {announcements.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">No announcements</p>
                ) : (
                  announcements.slice(0, 5).map((ann) => (
                    <div 
                      key={ann.id} 
                      className="border-b border-slate-100 dark:border-slate-700 last:border-0 pb-4 last:pb-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors" 
                      data-testid={`announcement-${ann.id}`}
                      onClick={() => {
                        setSelectedAnnouncement(ann);
                        setViewAnnouncementOpen(true);
                      }}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <Badge className={ann.priority === 'Urgent' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' : ann.priority === 'Important' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'}>
                          {ann.priority}
                        </Badge>
                        <Badge variant="outline" className="dark:text-slate-300 dark:border-slate-600">{ann.category}</Badge>
                      </div>
                      <h4 className="font-semibold text-sm mb-1 dark:text-white">{ann.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {ann.description.length > 80 ? `${ann.description.substring(0, 80)}...` : ann.description}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">{new Date(ann.created_at).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Announcement Details Dialog */}
        <Dialog open={viewAnnouncementOpen} onOpenChange={setViewAnnouncementOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedAnnouncement?.title}
              </DialogTitle>
              <DialogDescription>
                Posted on {selectedAnnouncement && new Date(selectedAnnouncement.created_at).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            
            {selectedAnnouncement && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={selectedAnnouncement.priority === 'Urgent' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' : selectedAnnouncement.priority === 'Important' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'}>
                    {selectedAnnouncement.priority}
                  </Badge>
                  <Badge variant="outline" className="dark:text-slate-300 dark:border-slate-600">
                    {selectedAnnouncement.category}
                  </Badge>
                </div>
                
                <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {selectedAnnouncement.description}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentDashboard;
