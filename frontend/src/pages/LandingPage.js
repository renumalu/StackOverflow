import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { 
  Building2, 
  Moon, 
  Sun, 
  ArrowRight, 
  CheckCircle, 
  ShieldCheck, 
  Zap,
  MessageSquare,
  Search,
  Bell,
  Mail,
  Phone,
  FileText,
  Lock,
  MapPin
} from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const features = [
    {
      icon: <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      title: "Smart Issue Reporting",
      description: "Report maintenance issues instantly with photos and descriptions. Track status in real-time."
    },
    {
      icon: <Search className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      title: "Lost & Found",
      description: "Digital lost and found center to help you recover your belongings quickly and securely."
    },
    {
      icon: <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      title: "Digital Notice Board",
      description: "Never miss important announcements. Get instant notifications for hostel updates."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      title: "Secure & Private",
      description: "Role-based access control ensures your data is safe and only visible to authorized personnel."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">HostelHub</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              {user ? (
                <Button 
                  onClick={() => navigate(`/${user.role}/dashboard`)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login">
                    <Button variant="ghost" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/login?tab=register">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200/50 dark:shadow-none">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-sm font-medium mb-8 animate-fade-in">
                <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                New: Digital Gate Pass System
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 leading-tight animate-fade-up">
              Hostel life, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                Upgraded.
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed animate-fade-up delay-100">
              Ditch the paperwork. Manage your entire hostel experience from your pocket—complaints, mess polls, laundry, and now digital gate passes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up delay-200">
              {user ? (
                 <Button 
                  size="lg"
                  onClick={() => navigate(`/${user.role}/dashboard`)}
                  className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 dark:shadow-none transition-all hover:scale-105 rounded-full"
                >
                  Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              ) : (
                <>
                  <Link to="/login">
                    <Button 
                      size="lg"
                      className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 dark:shadow-none transition-all hover:scale-105 rounded-full"
                    >
                      Login to Portal
                    </Button>
                  </Link>
                  <Link to="/login?tab=register">
                    <Button 
                      size="lg"
                      variant="outline"
                      className="h-14 px-8 text-lg border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full"
                    >
                      New Registration
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-[1000px] h-[1000px] rounded-full bg-indigo-50/50 dark:bg-indigo-900/20 blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-1/2 w-[800px] h-[800px] rounded-full bg-violet-50/50 dark:bg-violet-900/20 blur-3xl animate-pulse delay-700"></div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-10 bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Active Students", value: "2,000+" },
              { label: "Issues Resolved", value: "98%" },
              { label: "Hostel Blocks", value: "12" },
              { label: "Support", value: "24/7" },
            ].map((stat, index) => (
              <div key={index} className="space-y-1 animate-fade-up delay-300">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-up">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Everything You Need</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              One app to rule them all (and find your lost hoodie).
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 duration-300 border border-slate-100 dark:border-slate-700 animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust/CTA Section */}
      <div className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-indigo-600 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Ready to streamline your hostel experience?</h2>
              <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
                Join thousands of students and management staff who trust our platform for their daily operations.
              </p>
              <div className="pt-4">
                <Link to="/login?tab=register">
                  <Button 
                    size="lg"
                    className="bg-white text-indigo-600 hover:bg-indigo-50 border-0 h-14 px-8 text-lg"
                  >
                    Get Started Now
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-indigo-500 opacity-50 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-indigo-700 opacity-50 blur-3xl"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span className="text-lg font-bold text-slate-900 dark:text-white">HostelHub</span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-sm">
              © {new Date().getFullYear()} HostelHub Management System. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-slate-400 hover:text-indigo-600 transition-colors text-sm font-medium">Privacy Policy</button>
                </DialogTrigger>
                <DialogContent className="dark:bg-slate-800 dark:border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 dark:text-white">
                      <Lock className="w-5 h-5 text-indigo-600" />
                      Privacy Policy
                    </DialogTitle>
                    <DialogDescription className="dark:text-slate-400">
                      Last updated: {new Date().toLocaleDateString()}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                    <section>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">1. Information We Collect</h4>
                      <p>We collect information that you provide directly to us, such as when you create an account, update your profile, report an issue, or communicate with us. This includes:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Name, email address, phone number, and student ID.</li>
                        <li>Hostel block and room number assignments.</li>
                        <li>Content of messages, issue reports, and gate pass requests.</li>
                      </ul>
                    </section>
                    <section>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">2. How We Use Information</h4>
                      <p>We use the information we collect to:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Provide, maintain, and improve our services.</li>
                        <li>Process and manage hostel operations like gate passes and complaints.</li>
                        <li>Send you technical notices, updates, security alerts, and administrative messages.</li>
                      </ul>
                    </section>
                    <section>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">3. Data Security</h4>
                      <p>We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no system is completely secure.</p>
                    </section>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-slate-400 hover:text-indigo-600 transition-colors text-sm font-medium">Terms of Service</button>
                </DialogTrigger>
                <DialogContent className="dark:bg-slate-800 dark:border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 dark:text-white">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      Terms of Service
                    </DialogTitle>
                    <DialogDescription className="dark:text-slate-400">
                      Please read these terms carefully before using our platform.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                    <section>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">1. Acceptance of Terms</h4>
                      <p>By accessing or using HostelHub, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
                    </section>
                    <section>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">2. User Accounts</h4>
                      <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.</p>
                    </section>
                    <section>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">3. Acceptable Use</h4>
                      <p>You agree not to use the platform to:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Submit false or misleading information.</li>
                        <li>Harass, abuse, or harm another person.</li>
                        <li>Interfere with the proper working of the platform.</li>
                      </ul>
                    </section>
                    <section>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">4. Termination</h4>
                      <p>We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.</p>
                    </section>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-slate-400 hover:text-indigo-600 transition-colors text-sm font-medium">Contact</button>
                </DialogTrigger>
                <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 dark:text-white">
                      <Phone className="w-5 h-5 text-indigo-600" />
                      Contact Support
                    </DialogTitle>
                    <DialogDescription className="dark:text-slate-400">
                      Need help? Reach out to the administration.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">Email Us</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">For general inquiries and support</p>
                        <a href="mailto:support@hostelhub.edu" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                          support@hostelhub.edu
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">Emergency Hotline</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">For urgent maintenance or security issues</p>
                        <a href="tel:+1234567890" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                          +1 (234) 567-890
                        </a>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
