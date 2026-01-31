import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Moon, Sun, Utensils, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMessMenu, voteMessMenu } from '../utils/api';

const MessMenuPage = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  });

  useEffect(() => {
    fetchMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const data = await getMessMenu(activeDay);
      setMenu(data);
    } catch (error) {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (menuId, voteType) => {
    try {
      await voteMessMenu(menuId, voteType);
      fetchMenu(); // Refresh to show updated counts
      toast.success(voteType === 'up' ? 'Upvoted!' : 'Downvoted');
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const getMealOrder = (mealType) => {
    const order = { 'Breakfast': 1, 'Lunch': 2, 'Snacks': 3, 'Dinner': 4 };
    return order[mealType] || 99;
  };

  const sortedMenu = [...menu].sort((a, b) => getMealOrder(a.meal_type) - getMealOrder(b.meal_type));

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mess Menu & Voting</h1>
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
        <div className="mb-8 overflow-x-auto">
          <Tabs value={activeDay} onValueChange={setActiveDay} className="w-full">
            <TabsList className="w-full justify-start dark:bg-slate-800 p-1">
              {days.map(day => (
                <TabsTrigger key={day} value={day} className="flex-1 min-w-[100px]">{day}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading menu...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedMenu.map((item) => (
              <Card key={item.id} className="dark:bg-slate-800 dark:border-slate-700 hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-indigo-500" />
                    {item.meal_type}
                  </CardTitle>
                  <div className="flex gap-2">
                     <Button 
                      variant={item.voters[user.id] === 'up' ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleVote(item.id, 'up')}
                      className={item.voters[user.id] === 'up' ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {item.votes_up}
                    </Button>
                    <Button 
                      variant={item.voters[user.id] === 'down' ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleVote(item.id, 'down')}
                      className={item.voters[user.id] === 'down' ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      {item.votes_down}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Regular Menu</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.items.map((food, idx) => (
                          <Badge key={idx} variant="secondary" className="text-base py-1 px-3 dark:bg-slate-700 dark:text-slate-200">
                            {food}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {item.special_items && item.special_items.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                          <Star className="w-4 h-4" /> Specials
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {item.special_items.map((food, idx) => (
                            <Badge key={idx} className="bg-amber-100 text-amber-800 border-amber-200 text-base py-1 px-3">
                              {food}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {sortedMenu.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">No menu available for this day.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MessMenuPage;
