import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Building2, LogIn, UserPlus, Moon, Sun } from 'lucide-react';

const LoginPage = () => {
  const { login, register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeTab = searchParams.get('tab') || 'login';
  const setActiveTab = (value) => {
    setSearchParams({ tab: value });
  };
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'student',
    hostel: '',
    block: '',
    room: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(loginData.email, loginData.password);
    if (!result.success) {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await register(registerData);
    if (!result.success) {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6 relative">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-yellow-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        title="Toggle dark mode"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block" data-testid="login-hero-section">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Hostel Management</h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Streamline hostel operations with our comprehensive management system. Report issues, track resolutions, and stay connected with your hostel community.
            </p>
            <img 
              src="https://images.unsplash.com/photo-1618831352005-83a8a8b65c6d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwYWNjb21tb2RhdGlvbnxlbnwwfHx8fDE3Njk4NDAxMTJ8MA&ixlib=rb-4.1.0&q=85" 
              alt="College Hostel" 
              className="rounded-2xl shadow-lg w-full h-96 object-cover"
            />
          </div>
        </div>

        <Card className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg" data-testid="auth-card">
          <CardHeader className="space-y-1 p-8">
            <CardTitle className="text-3xl font-bold tracking-tight dark:text-white">Welcome</CardTitle>
            <CardDescription className="text-base dark:text-slate-400">Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="login-tab">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" data-testid="login-form">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      data-testid="login-email-input"
                      type="email"
                      placeholder="your@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      data-testid="login-password-input"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-indigo-200/50 transition-all"
                    disabled={loading}
                    data-testid="login-submit-button"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" data-testid="register-form">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="dark:text-slate-200">Full Name</Label>
                    <Input
                      id="register-name"
                      data-testid="register-name-input"
                      type="text"
                      placeholder="John Doe"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                      className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="dark:text-slate-200">Email</Label>
                    <Input
                      id="register-email"
                      data-testid="register-email-input"
                      type="email"
                      placeholder="your@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="dark:text-slate-200">Password</Label>
                    <Input
                      id="register-password"
                      data-testid="register-password-input"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      minLength={6}
                      className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-phone" className="dark:text-slate-200">Phone (Optional)</Label>
                    <Input
                      id="register-phone"
                      data-testid="register-phone-input"
                      type="tel"
                      placeholder="+1234567890"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-role" className="dark:text-slate-200">Role</Label>
                    <Select 
                      value={registerData.role} 
                      onValueChange={(value) => setRegisterData({ ...registerData, role: value })}
                    >
                      <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" data-testid="register-role-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {registerData.role === 'student' && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-hostel" className="dark:text-slate-200">Hostel</Label>
                          <Input
                            id="register-hostel"
                            data-testid="register-hostel-input"
                            placeholder="A"
                            value={registerData.hostel}
                            onChange={(e) => setRegisterData({ ...registerData, hostel: e.target.value })}
                            required
                            className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-block" className="dark:text-slate-200">Block</Label>
                          <Input
                            id="register-block"
                            data-testid="register-block-input"
                            placeholder="1"
                            value={registerData.block}
                            onChange={(e) => setRegisterData({ ...registerData, block: e.target.value })}
                            required
                            className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-room" className="dark:text-slate-200">Room</Label>
                          <Input
                            id="register-room"
                            data-testid="register-room-input"
                            placeholder="101"
                            value={registerData.room}
                            onChange={(e) => setRegisterData({ ...registerData, room: e.target.value })}
                            required
                            className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-indigo-200/50 transition-all"
                    disabled={loading}
                    data-testid="register-submit-button"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
