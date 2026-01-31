import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Moon, Sun, Timer, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLaundryMachines, bookLaundryMachine, releaseLaundryMachine } from '../utils/api';

const LaundryPage = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [duration, setDuration] = useState(45);
  const [useDialogOpen, setUseDialogOpen] = useState(false);

  useEffect(() => {
    fetchMachines();
    const interval = setInterval(fetchMachines, 30000); // Poll every 30s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const data = await getLaundryMachines(user?.block); // Fetch for user's block
      setMachines(data);
    } catch (error) {
      toast.error('Failed to load laundry machines');
    } finally {
      setLoading(false);
    }
  };

  const handleUseMachine = async () => {
    try {
      await bookLaundryMachine(selectedMachine.id, duration);
      toast.success('Machine booked successfully');
      setUseDialogOpen(false);
      fetchMachines();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to book machine');
    }
  };

  const handleReleaseMachine = async (machineId) => {
    try {
      await releaseLaundryMachine(machineId);
      toast.success('Machine released');
      fetchMachines();
    } catch (error) {
      toast.error('Failed to release machine');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-700 border-green-200';
      case 'In Use': return 'bg-red-100 text-red-700 border-red-200';
      case 'Maintenance': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const calculateTimeRemaining = (endTime) => {
    if (!endTime) return null;
    const end = new Date(endTime);
    const now = new Date();
    const diff = Math.max(0, Math.floor((end - now) / 60000));
    return diff;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Laundry Status ({user?.block})</h1>
          </div>
          <div className="flex items-center gap-3">
             <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-yellow-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                title="Toggle dark mode"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading && machines.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading machines...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {machines.map((machine) => {
              const remaining = calculateTimeRemaining(machine.end_time);
              const isMine = machine.current_user_id === user.id;

              return (
                <Card key={machine.id} className="dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-all">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                      {machine.type} {machine.machine_number}
                    </CardTitle>
                    <Badge className={getStatusColor(machine.status)}>{machine.status}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Floor: {machine.floor}
                      </div>
                      
                      {machine.status === 'In Use' && (
                        <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium dark:text-slate-300">Time Remaining</span>
                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <Timer className="w-4 h-4" />
                              {remaining} mins
                            </span>
                          </div>
                          {isMine && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2 border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => handleReleaseMachine(machine.id)}
                            >
                              Finish & Release
                            </Button>
                          )}
                        </div>
                      )}

                      {machine.status === 'Available' && (
                        <Dialog open={useDialogOpen && selectedMachine?.id === machine.id} onOpenChange={(open) => {
                          setUseDialogOpen(open);
                          if (!open) setSelectedMachine(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              className="w-full bg-indigo-600 hover:bg-indigo-700"
                              onClick={() => setSelectedMachine(machine)}
                            >
                              Use Machine
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
                            <DialogHeader>
                              <DialogTitle className="dark:text-white">Use {machine.type}</DialogTitle>
                              <DialogDescription className="dark:text-slate-400">
                                Set the timer for your laundry cycle.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label className="dark:text-white">Duration (minutes)</Label>
                                <Input 
                                  type="number" 
                                  value={duration}
                                  onChange={(e) => setDuration(parseInt(e.target.value))}
                                  min="15"
                                  max="120"
                                  className="dark:bg-slate-700 dark:text-white"
                                />
                              </div>
                              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleUseMachine}>
                                Start Cycle
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {machines.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">No machines found for your block.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default LaundryPage;
