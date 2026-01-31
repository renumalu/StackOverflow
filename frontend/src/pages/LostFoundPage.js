import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Search, Plus, MapPin, Calendar, Phone, CheckCircle, CheckCircle2, AlertCircle, Home, ArrowLeft, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LostFoundPage = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lost');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    type: 'lost',
    item_name: '',
    description: '',
    category: 'Others',
    location: { hostel: '', block: '', specific_place: '' },
    contact_info: { phone: '', email: user?.email || '', preferred_contact: 'email' }
  });

  const fetchItems = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/lost-found?type=${activeTab}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch items');
      
      const data = await response.json();
      setItems(data);
    } catch (error) {
      toast.error('Failed to load lost & found items');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/lost-found`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newItem)
      });

      if (!response.ok) throw new Error('Failed to report item');

      toast.success('Item reported successfully');
      setCreateDialogOpen(false);
      setNewItem({
        type: 'lost',
        item_name: '',
        description: '',
        category: 'Others',
        location: { hostel: '', block: '', specific_place: '' },
        contact_info: { phone: '', email: user?.email || '', preferred_contact: 'email' }
      });
      fetchItems();
    } catch (error) {
      toast.error('Failed to report item');
    }
  };

  const handleClaimItem = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/lost-found/${itemId}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) throw new Error('Failed to claim item');

      toast.success('Item claimed successfully! Please visit the caretaker office for verification.');
      fetchItems();
    } catch (error) {
      toast.error(error.message || 'Failed to claim item');
    }
  };

  const handleVerifyClaim = async (itemId, verified) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/lost-found/${itemId}/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verified })
      });

      if (!response.ok) throw new Error('Failed to verify claim');

      toast.success(verified ? 'Claim verified and item returned!' : 'Claim rejected');
      fetchItems();
    } catch (error) {
      toast.error('Failed to verify claim');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Open: 'bg-green-100 text-green-700',
      Matched: 'bg-amber-100 text-amber-700',
      Claimed: 'bg-amber-100 text-amber-700',
      Returned: 'bg-slate-100 text-slate-700',
      Closed: 'bg-gray-100 text-gray-700'
    };
    return styles[status] || styles.Open;
  };

  const filteredItems = items.filter(item => 
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Lost & Found</h1>
          </div>
          <div className="flex items-center gap-3">
             <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-yellow-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                title="Toggle dark mode"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Report Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl dark:bg-slate-800 dark:border-slate-700">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Report Lost/Found Item</DialogTitle>
                  <DialogDescription className="dark:text-slate-400">Please provide details about the item.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateItem} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="dark:text-white">Type</Label>
                      <Select 
                        value={newItem.type} 
                        onValueChange={(value) => setNewItem({ ...newItem, type: value })}
                      >
                        <SelectTrigger className="dark:bg-slate-700 dark:text-white dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                          <SelectItem value="lost">Lost</SelectItem>
                          <SelectItem value="found">Found</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="dark:text-white">Category</Label>
                      <Select 
                        value={newItem.category} 
                        onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                      >
                        <SelectTrigger className="dark:bg-slate-700 dark:text-white dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Documents">Documents</SelectItem>
                          <SelectItem value="Clothing">Clothing</SelectItem>
                          <SelectItem value="Accessories">Accessories</SelectItem>
                          <SelectItem value="Keys">Keys</SelectItem>
                          <SelectItem value="Books">Books</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="dark:text-white">Item Name</Label>
                    <Input 
                      value={newItem.item_name}
                      onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                      placeholder="e.g., Blue Water Bottle"
                      className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="dark:text-white">Description</Label>
                    <Textarea 
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Detailed description of the item..."
                      className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="dark:text-white">Hostel</Label>
                      <Input 
                        value={newItem.location.hostel}
                        onChange={(e) => setNewItem({ ...newItem, location: { ...newItem.location, hostel: e.target.value } })}
                        placeholder="Hostel Name"
                        className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="dark:text-white">Block</Label>
                      <Input 
                        value={newItem.location.block}
                        onChange={(e) => setNewItem({ ...newItem, location: { ...newItem.location, block: e.target.value } })}
                        placeholder="Block"
                        className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="dark:text-white">Specific Place</Label>
                      <Input 
                        value={newItem.location.specific_place}
                        onChange={(e) => setNewItem({ ...newItem, location: { ...newItem.location, specific_place: e.target.value } })}
                        placeholder="e.g., Common Room"
                        className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Submit Report</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="lost" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2 dark:bg-slate-800">
            <TabsTrigger value="lost">Lost Items</TabsTrigger>
            <TabsTrigger value="found">Found Items</TabsTrigger>
          </TabsList>

          <div className="mt-6 flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input 
                placeholder="Search items..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>
          </div>

          <TabsContent value="lost" className="mt-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading lost items...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-all dark:bg-slate-800 dark:border-slate-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Badge variant="outline" className="mb-2 dark:text-slate-300 dark:border-slate-600">{item.category}</Badge>
                        <Badge className={getStatusBadge(item.status)}>{item.status}</Badge>
                      </div>
                      <CardTitle className="text-lg dark:text-white">{item.item_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">{item.description}</p>
                      <div className="space-y-2 text-sm text-slate-500 dark:text-slate-500">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{item.location.hostel}, {item.location.block}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(item.date_reported).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>Contact: {item.contact_info.preferred_contact === 'email' ? 'Email' : 'Phone'}</span>
                        </div>
                      </div>
                      
                      {/* Management Actions */}
                      {user.role === 'management' && (item.status === 'Matched' || item.status === 'Claimed') && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700" 
                            size="sm"
                            onClick={() => handleVerifyClaim(item.id, true)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Verify & Return
                          </Button>
                          <Button 
                            className="flex-1" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleVerifyClaim(item.id, false)}
                          >
                            Reject Claim
                          </Button>
                        </div>
                      )}

                       {/* Student Actions - Found Items Tab mainly, but also Lost if I found it? No, usually I claim a FOUND item. */}
                       {/* If this is the "found" tab (items found by others), and I am a student, I can claim it. */}
                    </CardContent>
                  </Card>
                ))}
                {filteredItems.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400">No items found</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="found" className="mt-0">
             {/* Same grid as above but for found items. */}
             {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading found items...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-all dark:bg-slate-800 dark:border-slate-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Badge variant="outline" className="mb-2 dark:text-slate-300 dark:border-slate-600">{item.category}</Badge>
                        <Badge className={getStatusBadge(item.status)}>{item.status}</Badge>
                      </div>
                      <CardTitle className="text-lg dark:text-white">{item.item_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">{item.description}</p>
                      <div className="space-y-2 text-sm text-slate-500 dark:text-slate-500">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{item.location.hostel}, {item.location.block}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(item.date_reported).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {/* Claim Action for Students */}
                      {user.role === 'student' && item.status === 'Open' && item.reporter !== user.id && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                          <Button 
                            className="w-full bg-indigo-600 hover:bg-indigo-700" 
                            size="sm"
                            onClick={() => handleClaimItem(item.id)}
                          >
                            This is mine! (Claim)
                          </Button>
                        </div>
                      )}

                       {/* Management Actions */}
                      {user.role === 'management' && (item.status === 'Matched' || item.status === 'Claimed') && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700" 
                            size="sm"
                            onClick={() => handleVerifyClaim(item.id, true)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Verify & Return
                          </Button>
                          <Button 
                            className="flex-1" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleVerifyClaim(item.id, false)}
                          >
                            Reject Claim
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                 {filteredItems.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400">No items found</p>
                  </div>
                )}
              </div>
             )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default LostFoundPage;
