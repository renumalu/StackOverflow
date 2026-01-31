import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { getStudents, markAttendance, getAttendanceStats, createIssue, createPoll, getRoomOccupancy } from '../utils/api';
import { toast } from 'sonner';
import { Plus, AlertCircle, TrendingUp, CheckCircle, CheckCircle2, Clock, LogOut, BarChart3, Megaphone, Home, Moon, Sun, Users, Calendar, Search, Ticket, Vote, Building, BedDouble } from 'lucide-react';
import { Link } from 'react-router-dom';

const ManagementDashboard = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [issues, setIssues] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createAnnouncementOpen, setCreateAnnouncementOpen] = useState(false);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [createPollOpen, setCreatePollOpen] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    category: 'Maintenance',
    priority: 'Medium',
    visibility: 'Public'
  });
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', '']
  });
  const [roomData, setRoomData] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // State for issue assignment
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedIssueForAssignment, setSelectedIssueForAssignment] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [staffMembers, setStaffMembers] = useState([]);
  
  // Student & Attendance State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentSearch, setStudentSearch] = useState('');
  const [viewStudentDialogOpen, setViewStudentDialogOpen] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('Present');
  const [attendanceRemarks, setAttendanceRemarks] = useState('');

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    description: '',
    priority: 'Normal',
    category: 'General',
    hostel: '',
    block: ''
  });

  useEffect(() => {
    fetchData();
    fetchStaffMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const fetchStaffMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/staff`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStaffMembers(data);
      }
    } catch (error) {
      console.error('Failed to fetch staff members');
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      setLoading(true);
      
      // Fetch all issues - backend automatically filters based on user role
      // Management users get ALL issues, students get their own + public issues
      const issuesUrl = selectedStatus === 'all' 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/issues?limit=100`
        : `${process.env.REACT_APP_BACKEND_URL}/api/issues?status=${selectedStatus}&limit=100`;
      
      const [issuesResponse, analyticsResponse] = await Promise.all([
        fetch(issuesUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/analytics/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!issuesResponse.ok || !analyticsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const issuesData = await issuesResponse.json();
      const analyticsData = await analyticsResponse.json();
      
      setIssues(issuesData);
      setAnalytics(analyticsData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      toast.error('Failed to fetch students');
    }
  };

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'rooms') {
      fetchRoomData();
    }
  }, [activeTab]);

  const handleViewStudent = async (student) => {
    setSelectedStudent(student);
    setViewStudentDialogOpen(true);
    try {
      const stats = await getAttendanceStats(student.id);
      setStudentStats(stats);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedStudent) return;
    try {
      await markAttendance({
        student_id: selectedStudent.id,
        status: attendanceStatus,
        date: new Date(attendanceDate).toISOString(),
        remarks: attendanceRemarks
      });
      toast.success('Attendance marked successfully');
      // Refresh stats
      const stats = await getAttendanceStats(selectedStudent.id);
      setStudentStats(stats);
    } catch (error) {
      toast.error('Failed to mark attendance');
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    try {
      await createIssue(newIssue);
      toast.success('Issue reported successfully!');
      setCreateIssueOpen(false);
      setNewIssue({
        title: '',
        description: '',
        category: 'Maintenance',
        priority: 'Medium',
        visibility: 'Public'
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to report issue');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/announcements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newAnnouncement,
          target_audience: {
            roles: ['student', 'management'],
            hostels: [],
            blocks: []
          },
          is_pinned: false,
          expires_at: null
        })
      });

      if (!response.ok) throw new Error('Failed to create announcement');

      toast.success('Announcement created successfully!');
      setCreateAnnouncementOpen(false);
      setNewAnnouncement({
        title: '',
        description: '',
        priority: 'Normal',
        category: 'General'
      });
    } catch (error) {
      toast.error('Failed to create announcement');
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    try {
      await createPoll({
        question: newPoll.question,
        options: newPoll.options.filter(o => o.trim() !== '')
      });
      toast.success('Poll created successfully');
      setCreatePollOpen(false);
      setNewPoll({ question: '', options: ['', ''] });
    } catch (error) {
      toast.error('Failed to create poll');
    }
  };

  const fetchRoomData = async () => {
    try {
      const data = await getRoomOccupancy();
      setRoomData(data);
    } catch (error) {
      toast.error('Failed to fetch room data');
    }
  };

  const handleAssignIssue = async () => {
    if (!selectedIssueForAssignment || !selectedStaffId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/issues/${selectedIssueForAssignment.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'Assigned',
          assigned_to: selectedStaffId,
          remarks: 'Assigned to staff member'
        })
      });

      if (!response.ok) throw new Error('Failed to assign issue');

      toast.success('Issue assigned successfully');
      setAssignmentDialogOpen(false);
      setSelectedIssueForAssignment(null);
      setSelectedStaffId('');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign issue');
    }
  };

  const handleUpdateIssueStatus = async (issueId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/issues/${issueId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          remarks: `Status updated to ${newStatus} by management`
        })
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success('Issue status updated successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to update issue status');
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
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Management Dashboard</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Welcome, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-yellow-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              title="Toggle dark mode"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Dialog open={createIssueOpen} onOpenChange={setCreateIssueOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </DialogTrigger>
              <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Report Issue</DialogTitle>
                  <DialogDescription className="dark:text-slate-400">Report a maintenance issue or incident</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateIssue} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="dark:text-white">Title</Label>
                    <Input
                      placeholder="Brief description"
                      value={newIssue.title}
                      onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                      className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-white">Description</Label>
                    <Textarea
                      placeholder="Detailed description"
                      rows={4}
                      value={newIssue.description}
                      onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                      className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="dark:text-white">Category</Label>
                      <Select value={newIssue.category} onValueChange={(value) => setNewIssue({ ...newIssue, category: value })}>
                        <SelectTrigger className="dark:bg-slate-700 dark:text-white dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Plumbing">Plumbing</SelectItem>
                          <SelectItem value="Electrical">Electrical</SelectItem>
                          <SelectItem value="Cleanliness">Cleanliness</SelectItem>
                          <SelectItem value="Security">Security</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="dark:text-white">Priority</Label>
                      <Select value={newIssue.priority} onValueChange={(value) => setNewIssue({ ...newIssue, priority: value })}>
                        <SelectTrigger className="dark:bg-slate-700 dark:text-white dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Submit Issue
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={createPollOpen} onOpenChange={setCreatePollOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Vote className="w-4 h-4 mr-2" />
                  New Poll
                </Button>
              </DialogTrigger>
              <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Create Poll</DialogTitle>
                  <DialogDescription className="dark:text-slate-400">Create a new voting poll for students</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePoll} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="dark:text-white">Question</Label>
                    <Input
                      placeholder="e.g., What should be for Sunday lunch?"
                      value={newPoll.question}
                      onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                      className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-white">Options</Label>
                    {newPoll.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newPoll.options];
                            newOptions[index] = e.target.value;
                            setNewPoll({ ...newPoll, options: newOptions });
                          }}
                          className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                          required={index < 2}
                        />
                        {index >= 2 && (
                          <Button 
                            type="button"
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              const newOptions = newPoll.options.filter((_, i) => i !== index);
                              setNewPoll({ ...newPoll, options: newOptions });
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Option
                    </Button>
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Create Poll
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={createAnnouncementOpen} onOpenChange={setCreateAnnouncementOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Megaphone className="w-4 h-4 mr-2" />
                  New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Create Announcement</DialogTitle>
                  <DialogDescription className="dark:text-slate-400">Post a new announcement for hostel residents</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="dark:text-white">Title</Label>
                    <Input
                      placeholder="Announcement title"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-white">Description</Label>
                    <Textarea
                      placeholder="Announcement details"
                      rows={4}
                      value={newAnnouncement.description}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, description: e.target.value })}
                      className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="dark:text-white">Priority</Label>
                      <Select value={newAnnouncement.priority} onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, priority: value })}>
                        <SelectTrigger className="dark:bg-slate-700 dark:text-white dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Important">Important</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="dark:text-white">Category</Label>
                      <Select value={newAnnouncement.category} onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, category: value })}>
                        <SelectTrigger className="dark:bg-slate-700 dark:text-white dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Event">Event</SelectItem>
                          <SelectItem value="Emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="dark:text-white">Target Hostel (Optional)</Label>
                      <Input
                        placeholder="e.g., Hostel-A"
                        value={newAnnouncement.hostel}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, hostel: e.target.value })}
                        className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="dark:text-white">Target Block (Optional)</Label>
                      <Input
                        placeholder="e.g., Block-1"
                        value={newAnnouncement.block}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, block: e.target.value })}
                        className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Create Announcement
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 w-full md:w-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Issues
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <BedDouble className="w-4 h-4" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="gatepass" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Gate Passes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Total Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{analytics.total_issues}</div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Open Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-500">{analytics.open_issues}</div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-500">{analytics.resolved_issues}</div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Resolution Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {analytics.total_issues > 0 
                    ? Math.round((analytics.resolved_issues / analytics.total_issues) * 100)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Category Analytics */}
        {analytics && analytics.by_category && analytics.by_category.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="dark:text-white">Issues by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {analytics.by_category.map((cat) => (
                    <div key={cat._id} className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{cat.count}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{cat._id}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="dark:text-white">Issue Density by Hostel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.by_hostel_block && analytics.by_hostel_block.length > 0 ? (
                    analytics.by_hostel_block.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium dark:text-white">{item._id.hostel}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item._id.block}</p>
                          </div>
                        </div>
                        <div className="text-xl font-bold text-slate-700 dark:text-slate-200">{item.count}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-500 py-4">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Performance Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="dark:text-white">Average Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                    {analytics.avg_response_time_hours || 0}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">hours</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">Time taken to assign or start working on an issue</p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="dark:text-white">Average Resolution Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {analytics.avg_resolution_time_hours || 0}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">hours</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">Time taken to close an issue after reporting</p>
              </CardContent>
            </Card>
          </div>
        )}

          </TabsContent>

          <TabsContent value="issues">
            {/* Issues Management */}
            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="dark:text-white">All Issues</CardTitle>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48 dark:bg-slate-700 dark:text-white dark:border-slate-600" id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Reported">Reported</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {issues.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No issues found</p>
                </div>
              ) : (
                issues.map((issue) => (
                  <Card key={issue.id} className="border border-slate-200 hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getPriorityColor(issue.priority)}>{issue.priority}</Badge>
                            <Badge className={getStatusColor(issue.status)}>{issue.status}</Badge>
                            <code className="text-xs text-slate-500 font-mono">{issue.ticket_id}</code>
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{issue.title}</h3>
                          <p className="text-sm text-slate-600 mb-2">{issue.description.substring(0, 150)}...</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Reporter: {issue.reporter_name}</span>
                            <span>Location: {issue.location.hostel}-{issue.location.block}-{issue.location.room}</span>
                            <span>Category: {issue.category}</span>
                            <span>{new Date(issue.reported_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Link to={`/management/issues/${issue.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              View Details
                            </Button>
                          </Link>
                          {issue.status !== 'Resolved' && issue.status !== 'Closed' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => {
                                  setSelectedIssueForAssignment(issue);
                                  setAssignmentDialogOpen(true);
                                }}
                              >
                                Assign
                              </Button>
                              <Select 
                                value={issue.status} 
                                onValueChange={(value) => handleUpdateIssueStatus(issue.id, value)}
                              >
                                <SelectTrigger className="w-40" id={`status-update-${issue.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Reported">Reported</SelectItem>
                                  <SelectItem value="Assigned">Assigned</SelectItem>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Resolved">Resolved</SelectItem>
                                  <SelectItem value="Closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="dark:text-white">Student Directory</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input 
                      placeholder="Search students..." 
                      className="pl-10 dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Hostel/Room</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                          No students found
                        </TableCell>
                      </TableRow>
                    ) : (
                      students
                      .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase()))
                      .map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium dark:text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                              {student.name.charAt(0)}
                            </div>
                            {student.name}
                          </div>
                        </TableCell>
                        <TableCell className="dark:text-slate-300">{student.hostel} / {student.block}-{student.room}</TableCell>
                        <TableCell className="dark:text-slate-300">
                          <div className="text-sm">{student.email}</div>
                          <div className="text-xs text-slate-500">{student.phone}</div>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleViewStudent(student)}>
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    )))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="rooms">
            <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="dark:text-white">Room Occupancy</CardTitle>
              </CardHeader>
              <CardContent>
                {roomData.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No room data available
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {roomData.map((room) => (
                      <div 
                        key={room.id} 
                        className={`p-4 rounded-lg border ${
                          room.occupied >= room.capacity 
                            ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                            : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{room.number}</span>
                          <Badge variant="outline" className="bg-white dark:bg-slate-800">
                            {room.block}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {room.occupied} / {room.capacity}
                        </div>
                        <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              room.occupied >= room.capacity ? 'bg-red-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(room.occupied / room.capacity) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="gatepass">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 text-center">
              <Ticket className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Gate Pass Management</h3>
              <p className="text-slate-500 mb-6">Manage student gate pass requests, approve or reject outings.</p>
              <Link to="/management/gatepass">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Go to Gate Pass Console
                </Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={viewStudentDialogOpen} onOpenChange={setViewStudentDialogOpen}>
        <DialogContent className="max-w-3xl dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card className="dark:bg-slate-700 dark:border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-base dark:text-white">Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-medium">{selectedStudent.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium">{selectedStudent.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-medium">{selectedStudent.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Room:</span>
                      <span className="font-medium">{selectedStudent.hostel} / {selectedStudent.block}-{selectedStudent.room}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="dark:bg-slate-700 dark:border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-base dark:text-white">Attendance Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {studentStats ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Attendance Rate</span>
                          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{studentStats.AttendancePercentage}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded text-green-700 dark:text-green-400">
                            <div className="font-bold">{studentStats.Present}</div>
                            <div className="text-xs">Present</div>
                          </div>
                          <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded text-red-700 dark:text-red-400">
                            <div className="font-bold">{studentStats.Absent}</div>
                            <div className="text-xs">Absent</div>
                          </div>
                          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded text-yellow-700 dark:text-yellow-400">
                            <div className="font-bold">{studentStats.Leave}</div>
                            <div className="text-xs">Leave</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500">Loading stats...</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="dark:bg-slate-700 dark:border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-base dark:text-white">Mark Attendance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="dark:text-white">Date</Label>
                      <Input 
                        type="date" 
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="dark:bg-slate-600 dark:text-white dark:border-slate-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="dark:text-white">Status</Label>
                      <div className="flex gap-2">
                        {['Present', 'Absent', 'Leave'].map((status) => (
                          <Button
                            key={status}
                            variant={attendanceStatus === status ? 'default' : 'outline'}
                            onClick={() => setAttendanceStatus(status)}
                            className={attendanceStatus === status ? 'bg-indigo-600' : ''}
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="dark:text-white">Remarks</Label>
                      <Input 
                        value={attendanceRemarks}
                        onChange={(e) => setAttendanceRemarks(e.target.value)}
                        placeholder="Optional remarks"
                        className="dark:bg-slate-600 dark:text-white dark:border-slate-500"
                      />
                    </div>
                    <Button onClick={handleMarkAttendance} className="w-full bg-indigo-600 hover:bg-indigo-700">
                      Save Attendance
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Assign Issue</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Select a staff member to assign this issue to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="dark:text-white">Staff Member</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="dark:bg-slate-700 dark:text-white dark:border-slate-600">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} ({staff.expertise || 'Staff'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssignIssue} className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={!selectedStaffId}>
              Assign Issue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagementDashboard;
