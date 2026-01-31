import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Ticket, Calendar, Clock, MapPin, Phone, CheckCircle, XCircle, Clock3, QrCode, ArrowLeft } from 'lucide-react';
import { applyGatePass, getGatePasses, updateGatePassStatus } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const GatePassPage = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('my-passes');
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    type: 'Outing',
    reason: '',
    destination: '',
    depart_time: '',
    return_time: '',
    contact_number: user?.phone || ''
  });

  useEffect(() => {
    fetchPasses();
  }, [activeTab]);

  const fetchPasses = async () => {
    try {
      setLoading(true);
      const data = await getGatePasses();
      setPasses(data);
    } catch (error) {
      toast.error('Failed to load gate passes');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await applyGatePass({
        ...formData,
        depart_time: new Date(formData.depart_time).toISOString(),
        return_time: new Date(formData.return_time).toISOString()
      });
      toast.success('Gate pass application submitted');
      setActiveTab('my-passes');
      fetchPasses();
      setFormData({
        type: 'Outing',
        reason: '',
        destination: '',
        depart_time: '',
        return_time: '',
        contact_number: user?.phone || ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit application');
    }
  };

  const handleStatusUpdate = async (passId, status, reason = null) => {
    try {
      await updateGatePassStatus(passId, { status, reason });
      toast.success(`Gate pass ${status.toLowerCase()}`);
      fetchPasses();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      Approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      Used: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
      Expired: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.Pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-600" />
              Digital Gate Pass
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <TabsTrigger value="my-passes" className="gap-2">
              <Ticket className="w-4 h-4" />
              My Passes
            </TabsTrigger>
            {user.role === 'student' && (
              <TabsTrigger value="apply" className="gap-2">
                <Calendar className="w-4 h-4" />
                Apply New
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="my-passes" className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-slate-500">Loading passes...</div>
            ) : passes.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <Ticket className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">No passes found</h3>
                <p className="text-slate-500">You haven't applied for any gate passes yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {passes.map((pass) => (
                  <Card key={pass.id} className="overflow-hidden bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row">
                      {/* Left: Info */}
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg dark:text-white">{pass.type}</h3>
                              {getStatusBadge(pass.status)}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Ref: {pass.id.substring(0, 8).toUpperCase()}
                            </p>
                          </div>
                          {user.role === 'management' && pass.status === 'Pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleStatusUpdate(pass.id, 'Approved')} className="bg-green-600 hover:bg-green-700">
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(pass.id, 'Rejected')}>
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Departure</span>
                            <p className="font-medium dark:text-slate-200">{new Date(pass.depart_time).toLocaleString()}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-500 flex items-center gap-1"><Clock3 className="w-3 h-3" /> Return</span>
                            <p className="font-medium dark:text-slate-200">{new Date(pass.return_time).toLocaleString()}</p>
                          </div>
                          <div className="col-span-2 space-y-1">
                            <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Destination</span>
                            <p className="font-medium dark:text-slate-200">{pass.destination}</p>
                          </div>
                          {pass.reason && (
                            <div className="col-span-2 space-y-1">
                              <span className="text-slate-500">Reason</span>
                              <p className="text-slate-700 dark:text-slate-300">{pass.reason}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Ticket Stub / QR */}
                      <div className="bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-dashed border-slate-300 dark:border-slate-700 min-w-[200px]">
                        {pass.status === 'Approved' ? (
                          <>
                            <div className="bg-white p-2 rounded-lg shadow-sm mb-3">
                              <QrCode className="w-24 h-24 text-slate-900" />
                            </div>
                            <span className="text-xs font-mono text-slate-500">SCAN AT GATE</span>
                          </>
                        ) : (
                          <div className="text-center text-slate-400">
                            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <span className="text-sm font-medium">
                              {pass.status === 'Pending' ? 'Awaiting Approval' : pass.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="apply">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle>Application Form</CardTitle>
                <CardDescription>Request permission to leave the hostel premises.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleApply} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Pass Type</Label>
                      <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Outing">Day Outing</SelectItem>
                          <SelectItem value="Home Visit">Home Visit</SelectItem>
                          <SelectItem value="Emergency">Emergency</SelectItem>
                          <SelectItem value="Vacation">Vacation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Number</Label>
                      <Input 
                        value={formData.contact_number}
                        onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                        placeholder="Emergency contact"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Departure Time</Label>
                      <Input 
                        type="datetime-local"
                        value={formData.depart_time}
                        onChange={(e) => setFormData({...formData, depart_time: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Return Time</Label>
                      <Input 
                        type="datetime-local"
                        value={formData.return_time}
                        onChange={(e) => setFormData({...formData, return_time: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Destination</Label>
                    <Input 
                      value={formData.destination}
                      onChange={(e) => setFormData({...formData, destination: e.target.value})}
                      placeholder="Where are you going?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea 
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      placeholder="Why do you need this pass?"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('my-passes')}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                      Submit Application
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GatePassPage;
