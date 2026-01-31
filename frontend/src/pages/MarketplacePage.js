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
import { toast } from 'sonner';
import { Search, Plus, ShoppingBag, Phone, ArrowLeft, Moon, Sun, Tag, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createMarketplaceListing, getMarketplaceListings, updateListingStatus } from '../utils/api';

const MarketplacePage = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Others',
    condition: 'Good',
    contact_phone: '',
    contact_email: user?.email || ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getMarketplaceListings();
      setItems(data);
    } catch (error) {
      toast.error('Failed to load marketplace items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      await createMarketplaceListing({
        ...newItem,
        price: parseFloat(newItem.price)
      });
      toast.success('Listing created successfully');
      setCreateDialogOpen(false);
      setNewItem({
        title: '',
        description: '',
        price: '',
        category: 'Others',
        condition: 'Good',
        contact_phone: '',
        contact_email: user?.email || ''
      });
      fetchItems();
    } catch (error) {
      toast.error('Failed to create listing');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateListingStatus(id, status);
      toast.success('Status updated');
      fetchItems();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Community Marketplace</h1>
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
                  Sell Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl dark:bg-slate-800 dark:border-slate-700">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Sell an Item</DialogTitle>
                  <DialogDescription className="dark:text-slate-400">List your item for sale in the community.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateItem} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="Books">Books</SelectItem>
                          <SelectItem value="Furniture">Furniture</SelectItem>
                          <SelectItem value="Clothing">Clothing</SelectItem>
                          <SelectItem value="Accessories">Accessories</SelectItem>
                          <SelectItem value="Stationery">Stationery</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="dark:text-white">Condition</Label>
                      <Select 
                        value={newItem.condition} 
                        onValueChange={(value) => setNewItem({ ...newItem, condition: value })}
                      >
                        <SelectTrigger className="dark:bg-slate-700 dark:text-white dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Like New">Like New</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="dark:text-white">Title</Label>
                    <Input 
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                      placeholder="e.g., Calculus Textbook"
                      className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="dark:text-white">Price (₹)</Label>
                    <Input 
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      placeholder="0.00"
                      className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      required
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="dark:text-white">Description</Label>
                    <Textarea 
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Describe your item..."
                      className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="dark:text-white">Contact Phone</Label>
                    <Input 
                      value={newItem.contact_phone}
                      onChange={(e) => setNewItem({ ...newItem, contact_phone: e.target.value })}
                      placeholder="Optional"
                      className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">List Item</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading items...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-all dark:bg-slate-800 dark:border-slate-700 flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className="mb-2 dark:text-slate-300 dark:border-slate-600">{item.category}</Badge>
                    <Badge className={item.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>{item.status}</Badge>
                  </div>
                  <CardTitle className="text-lg dark:text-white">{item.title}</CardTitle>
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">₹{item.price}</div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3 flex-1">{item.description}</p>
                  
                  <div className="space-y-2 text-sm text-slate-500 dark:text-slate-500 mt-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <span>Condition: {item.condition}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      <span>Seller: {item.seller_name}</span>
                    </div>
                    {item.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{item.contact_phone}</span>
                      </div>
                    )}
                  </div>

                  {user.id === item.seller_id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      {item.status === 'Available' ? (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleStatusUpdate(item.id, 'Sold')}
                        >
                          Mark as Sold
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleStatusUpdate(item.id, 'Available')}
                        >
                          Mark as Available
                        </Button>
                      )}
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
      </main>
    </div>
  );
};

export default MarketplacePage;
