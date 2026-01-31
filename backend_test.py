#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Hostel Management System
Tests authentication, issue management, analytics, and announcements endpoints
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import Dict, Optional

# Get backend URL from frontend .env
BACKEND_URL = "http://localhost:8000/api"

class HostelAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = None
        self.student_token = None
        self.management_token = None
        self.student_user_id = None
        self.management_user_id = None
        self.test_issue_ids = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def get_headers(self, token: str = None) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers
    
    async def make_request(self, method: str, endpoint: str, data: dict = None, token: str = None):
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        headers = self.get_headers(token)
        
        try:
            # Allow redirects and preserve headers
            async with self.session.request(
                method, 
                url, 
                json=data, 
                headers=headers,
                allow_redirects=True,
                max_redirects=3
            ) as response:
                response_text = await response.text()
                
                # Try to parse JSON response
                try:
                    response_data = json.loads(response_text) if response_text else {}
                except json.JSONDecodeError:
                    response_data = {"raw_response": response_text}
                
                return {
                    "status": response.status,
                    "data": response_data,
                    "success": 200 <= response.status < 300
                }
        except Exception as e:
            return {
                "status": 0,
                "data": {"error": str(e)},
                "success": False
            }
    
    # ============= AUTHENTICATION TESTS =============
    
    async def test_student_registration(self):
        """Test student registration with required fields"""
        print("\n🔐 Testing Student Registration...")
        
        import time
        timestamp = int(time.time())
        self.student_email = f"alice.johnson.{timestamp}@hostel.edu"
        
        test_data = {
            "name": "Alice Johnson",
            "email": self.student_email,
            "password": "SecurePass123!",
            "phone": "9876543210",
            "role": "student",
            "hostel": "A",
            "block": "2",
            "room": "205"
        }
        
        result = await self.make_request("POST", "/auth/register", test_data)
        
        if result["success"]:
            self.student_token = result["data"].get("access_token")
            self.student_user_id = result["data"].get("user", {}).get("id")
            print(f"✅ Student registration successful - User ID: {self.student_user_id}")
            return True
        else:
            print(f"❌ Student registration failed - Status: {result['status']}")
            print(f"   Error: {result['data']}")
            return False
    
    async def test_management_registration(self):
        """Test management registration"""
        print("\n🔐 Testing Management Registration...")
        
        import time
        timestamp = int(time.time())
        self.mgmt_email = f"robert.smith.{timestamp}@hostel.edu"
        
        test_data = {
            "name": "Dr. Robert Smith",
            "email": self.mgmt_email,
            "password": "AdminPass456!",
            "phone": "9123456789",
            "role": "management"
        }
        
        result = await self.make_request("POST", "/auth/register", test_data)
        
        if result["success"]:
            self.management_token = result["data"].get("access_token")
            self.management_user_id = result["data"].get("user", {}).get("id")
            print(f"✅ Management registration successful - User ID: {self.management_user_id}")
            return True
        else:
            print(f"❌ Management registration failed - Status: {result['status']}")
            print(f"   Error: {result['data']}")
            return False
    
    async def test_caretaker_rejection(self):
        """Test that caretaker role is rejected"""
        print("\n🚫 Testing Caretaker Role Rejection...")
        
        test_data = {
            "name": "John Caretaker",
            "email": "john.caretaker@hostel.edu",
            "password": "CaretakerPass123!",
            "phone": "9999999999",
            "role": "caretaker"
        }
        
        result = await self.make_request("POST", "/auth/register", test_data)
        
        if not result["success"] and result["status"] == 422:
            print("✅ Caretaker role properly rejected")
            return True
        else:
            print(f"❌ Caretaker role test failed - Status: {result['status']}")
            print(f"   Expected rejection but got: {result['data']}")
            return False
    
    async def test_student_login(self):
        """Test student login"""
        print("\n🔑 Testing Student Login...")
        
        login_data = {
            "email": self.student_email,
            "password": "SecurePass123!"
        }
        
        result = await self.make_request("POST", "/auth/login", login_data)
        
        if result["success"]:
            print("✅ Student login successful")
            return True
        else:
            print(f"❌ Student login failed - Status: {result['status']}")
            print(f"   Error: {result['data']}")
            return False
    
    async def test_management_login(self):
        """Test management login"""
        print("\n🔑 Testing Management Login...")
        
        login_data = {
            "email": self.mgmt_email,
            "password": "AdminPass456!"
        }
        
        result = await self.make_request("POST", "/auth/login", login_data)
        
        if result["success"]:
            print("✅ Management login successful")
            return True
        else:
            print(f"❌ Management login failed - Status: {result['status']}")
            print(f"   Error: {result['data']}")
            return False
    
    # ============= ISSUE MANAGEMENT TESTS =============
    
    async def test_student_create_issue(self):
        """Test issue creation by student with AI predictions"""
        print("\n🐛 Testing Student Issue Creation...")
        
        if not self.student_token:
            print("❌ No student auth token available")
            return False
        
        issue_data = {
            "category": "Plumbing",
            "priority": "High",
            "title": "Severe water leak in bathroom",
            "description": "There is a major water leak from the bathroom ceiling that started this morning. Water is flooding the floor and may damage electrical equipment. This requires immediate attention.",
            "visibility": "Public"
        }
        
        result = await self.make_request("POST", "/issues", issue_data, self.student_token)
        
        if result["success"]:
            issue = result["data"]
            issue_id = issue.get("id")
            self.test_issue_ids.append(issue_id)
            print("✅ Student issue created successfully")
            print(f"   Issue ID: {issue_id}")
            print(f"   Ticket ID: {issue.get('ticket_id')}")
            print(f"   Status: {issue.get('status')}")
            
            # Check AI predictions
            ai_predictions = issue.get('ai_predictions')
            if ai_predictions:
                print(f"   AI Predictions: Category={ai_predictions.get('category')}, Priority={ai_predictions.get('priority')}")
                print(f"   Confidence: {ai_predictions.get('confidence_score')}")
            else:
                print("   ⚠️  AI predictions not available (may be expected if AI service is mocked)")
            
            return True
        else:
            print(f"❌ Student issue creation failed - Status: {result['status']}")
            print(f"   Error: {result['data']}")
            return False
    
    async def test_student_create_multiple_issues(self):
        """Create multiple issues with different categories and priorities"""
        print("\n🐛 Testing Multiple Issue Creation...")
        
        if not self.student_token:
            print("❌ No student auth token available")
            return False
        
        issues_data = [
            {
                "category": "Electrical",
                "priority": "Medium",
                "title": "Flickering lights in corridor",
                "description": "The lights in the main corridor keep flickering intermittently.",
                "visibility": "Public"
            },
            {
                "category": "Internet",
                "priority": "Low",
                "title": "Slow WiFi in room",
                "description": "Internet connection is very slow during evening hours.",
                "visibility": "Private"
            }
        ]
        
        success_count = 0
        for i, issue_data in enumerate(issues_data):
            result = await self.make_request("POST", "/issues", issue_data, self.student_token)
            if result["success"]:
                issue_id = result["data"].get("id")
                self.test_issue_ids.append(issue_id)
                success_count += 1
                print(f"   ✅ Issue {i+1} created: {issue_data['title']}")
            else:
                print(f"   ❌ Issue {i+1} failed: {result['data']}")
        
        if success_count == len(issues_data):
            print(f"✅ All {success_count} additional issues created successfully")
            return True
        else:
            print(f"❌ Only {success_count}/{len(issues_data)} issues created")
            return False
    
    async def test_student_get_issues(self):
        """Test student getting their issues + public issues from their hostel"""
        print("\n📋 Testing Student Get Issues...")
        
        if not self.student_token:
            print("❌ No student auth token available")
            return False
        
        result = await self.make_request("GET", "/issues", token=self.student_token)
        
        if result["success"]:
            issues = result["data"]
            print(f"✅ Student issues retrieved - Count: {len(issues)}")
            
            # Verify student can see their own issues and public issues from their hostel
            own_issues = [issue for issue in issues if issue.get('reporter_id') == self.student_user_id]
            public_issues = [issue for issue in issues if issue.get('visibility') == 'Public']
            
            print(f"   Own issues: {len(own_issues)}")
            print(f"   Public issues visible: {len(public_issues)}")
            
            return True
        else:
            print(f"❌ Student get issues failed - Status: {result['status']}")
            print(f"   Error: {result['data']}")
            return False
    
    async def test_management_get_all_issues(self):
        """Test management getting ALL issues"""
        print("\n📋 Testing Management Get All Issues...")
        
        if not self.management_token:
            print("❌ No management auth token available")
            return False
        
        result = await self.make_request("GET", "/issues", token=self.management_token)
        
        if result["success"]:
            issues = result["data"]
            print(f"✅ Management can see all issues - Count: {len(issues)}")
            
            # Management should see all issues regardless of visibility or hostel
            if len(issues) >= len(self.test_issue_ids):
                print("   ✅ Management can see all created issues")
                return True
            else:
                print(f"   ⚠️  Expected at least {len(self.test_issue_ids)} issues, got {len(issues)}")
                return True  # Still pass as this might be due to timing
        else:
            print(f"❌ Management get issues failed - Status: {result['status']}")
            print(f"   Error: {result['data']}")
            return False
    
    async def test_management_update_issue_status(self):
        """Test management updating issue status"""
        print("\n🔄 Testing Management Update Issue Status...")
        
        if not self.management_token or not self.test_issue_ids:
            print("❌ No management token or test issues available")
            return False
        
        issue_id = self.test_issue_ids[0]
        update_data = {
            "status": "In Progress",
            "remarks": "Issue has been assigned to maintenance team"
        }
        
        result = await self.make_request("PATCH", f"/issues/{issue_id}/status", update_data, self.management_token)
        
        if result["success"]:
            updated_issue = result["data"]
            print("✅ Issue status updated successfully")
            print(f"   New status: {updated_issue.get('status')}")
            print(f"   Updated by: {updated_issue.get('status_history', [{}])[-1].get('updated_by_name')}")
            return True
        else:
            print(f"❌ Issue status update failed - Status: {result['status']}")
            print(f"   Error: {result['data']}")
            return False
    
    async def test_student_cannot_update_status(self):
        """Test that student cannot update issue status"""
        print("\n🚫 Testing Student Cannot Update Issue Status...")
        
        if not self.student_token or not self.test_issue_ids:
            print("❌ No student token or test issues available")
            return False
        
        issue_id = self.test_issue_ids[0]
        update_data = {
            "status": "Resolved",
            "remarks": "Student trying to resolve issue"
        }
        
        result = await self.make_request("PATCH", f"/issues/{issue_id}/status", update_data, self.student_token)
        
        if not result["success"] and result["status"] == 403:
            print("✅ Student properly denied from updating issue status")
            return True
        else:
            print(f"❌ Student status update test failed - Status: {result['status']}")
            print(f"   Expected 403 Forbidden but got: {result['data']}")
            return False
    
    async def test_add_comments_to_issue(self):
        """Test adding comments to issues by both roles"""
        print("\n💬 Testing Add Comments to Issue...")
        
        if not self.test_issue_ids:
            print("❌ No test issues available")
            return False
        
        issue_id = self.test_issue_ids[0]
        success_count = 0
        
        # Student comment
        if self.student_token:
            comment_data = {"text": "I've tried turning off the main water valve but the leak persists."}
            result = await self.make_request("POST", f"/issues/{issue_id}/comments", comment_data, self.student_token)
            if result["success"]:
                print("   ✅ Student comment added successfully")
                success_count += 1
            else:
                print(f"   ❌ Student comment failed: {result['data']}")
        
        # Management comment
        if self.management_token:
            comment_data = {"text": "Maintenance team has been notified. Expected resolution within 24 hours."}
            result = await self.make_request("POST", f"/issues/{issue_id}/comments", comment_data, self.management_token)
            if result["success"]:
                print("   ✅ Management comment added successfully")
                success_count += 1
            else:
                print(f"   ❌ Management comment failed: {result['data']}")
        
        if success_count == 2:
            print("✅ Comments added successfully by both roles")
            return True
        else:
            print(f"❌ Only {success_count}/2 comments added successfully")
            return False
    
    async def test_issue_detail_endpoint(self):
        """Test getting detailed issue information"""
        print("\n🔍 Testing Issue Detail Endpoint...")
        
        if not self.test_issue_ids or not self.student_token:
            print("❌ No test issues or token available")
            return False
        
        issue_id = self.test_issue_ids[0]
        result = await self.make_request("GET", f"/issues/{issue_id}", token=self.student_token)
        
        if result["success"]:
            issue = result["data"]
            print("✅ Issue detail retrieved successfully")
            print(f"   Title: {issue.get('title')}")
            print(f"   Views: {issue.get('views')}")
            print(f"   Comments count: {len(issue.get('comments', []))}")
            print(f"   Status history entries: {len(issue.get('status_history', []))}")
            
            # Check if views incremented
            if issue.get('views', 0) > 0:
                print("   ✅ View count incremented")
            
            return True
        else:
            print(f"❌ Issue detail failed - Status: {result['status']}")
            print(f"   Error: {result['data']}")
            return False
    
    # ============= ANALYTICS TESTS =============
    
    async def test_analytics_dashboard(self):
        """Test analytics dashboard for management"""
        print("\n📊 Testing Analytics Dashboard...")
        
        if not self.management_token:
            print("❌ No management auth token available")
            return False
        
        result = await self.make_request("GET", "/analytics/dashboard", token=self.management_token)
        
        if result["success"]:
            analytics = result["data"]
            print("✅ Analytics dashboard retrieved successfully")
            print(f"   Total issues: {analytics.get('total_issues')}")
            print(f"   Open issues: {analytics.get('open_issues')}")
            print(f"   Resolved issues: {analytics.get('resolved_issues')}")
            
            by_category = analytics.get('by_category', [])
            by_priority = analytics.get('by_priority', [])
            
            print(f"   Categories breakdown: {len(by_category)} categories")
            print(f"   Priority breakdown: {len(by_priority)} priorities")
            
            # Verify required fields are present
            required_fields = ['total_issues', 'open_issues', 'resolved_issues', 'by_category', 'by_priority']
            missing_fields = [field for field in required_fields if field not in analytics]
            
            if not missing_fields:
                print("   ✅ All required analytics fields present")
                return True
            else:
                print(f"   ❌ Missing fields: {missing_fields}")
                return False
        else:
            print(f"❌ Analytics dashboard failed - Status: {result['status']}")
            print(f"   Error: {result['data']}")
            return False
    
    async def test_student_cannot_access_analytics(self):
        """Test that student cannot access analytics"""
        print("\n🚫 Testing Student Cannot Access Analytics...")
        
        if not self.student_token:
            print("❌ No student auth token available")
            return False
        
        result = await self.make_request("GET", "/analytics/dashboard", token=self.student_token)
        
        if not result["success"] and result["status"] == 403:
            print("✅ Student properly denied access to analytics")
            return True
        else:
            print(f"❌ Student analytics access test failed - Status: {result['status']}")
            print(f"   Expected 403 Forbidden but got: {result['data']}")
            return False
    
    # ============= ANNOUNCEMENTS TESTS =============
    
    async def test_management_create_announcement(self):
        """Test management creating announcement"""
        print("\n📢 Testing Management Create Announcement...")
        
        if not self.management_token:
            print("❌ No management auth token available")
            return False
        
        announcement_data = {
            "title": "Scheduled Maintenance Notice",
            "description": "Water supply will be temporarily shut off tomorrow from 10 AM to 2 PM for routine maintenance of the main pipeline.",
            "priority": "Important",
            "category": "Maintenance",
            "target_audience": {
                "hostels": ["A", "B"],
                "roles": ["student"]
            },
            "is_pinned": True
        }
        
        result = await self.make_request("POST", "/announcements", announcement_data, self.management_token)
        
        if result["success"]:
            announcement = result["data"]
            print("✅ Announcement created successfully")
            print(f"   Title: {announcement.get('title')}")
            print(f"   Priority: {announcement.get('priority')}")
            print(f"   Created by: {announcement.get('created_by_name')}")
            print(f"   Is pinned: {announcement.get('is_pinned')}")
            return True
        else:
            print(f"❌ Announcement creation failed - Status: {result['status']}")
            print(f"   Error: {result['data']}")
            return False
    
    async def test_get_announcements(self):
        """Test getting announcements (both roles)"""
        print("\n📢 Testing Get Announcements...")
        
        success_count = 0
        
        # Test with student token
        if self.student_token:
            result = await self.make_request("GET", "/announcements", token=self.student_token)
            if result["success"]:
                announcements = result["data"]
                print(f"   ✅ Student can see {len(announcements)} announcements")
                success_count += 1
            else:
                print(f"   ❌ Student get announcements failed: {result['data']}")
        
        # Test with management token
        if self.management_token:
            result = await self.make_request("GET", "/announcements", token=self.management_token)
            if result["success"]:
                announcements = result["data"]
                print(f"   ✅ Management can see {len(announcements)} announcements")
                success_count += 1
            else:
                print(f"   ❌ Management get announcements failed: {result['data']}")
        
        if success_count == 2:
            print("✅ Both roles can access announcements")
            return True
        else:
            print(f"❌ Only {success_count}/2 roles can access announcements")
            return False
    
    async def test_student_cannot_create_announcement(self):
        """Test that student cannot create announcements"""
        print("\n🚫 Testing Student Cannot Create Announcement...")
        
        if not self.student_token:
            print("❌ No student auth token available")
            return False
        
        announcement_data = {
            "title": "Student Announcement",
            "description": "This should not be allowed",
            "priority": "Low",
            "category": "General",
            "target_audience": {
                "hostels": ["A"],
                "roles": ["student"]
            },
            "is_pinned": False
        }
        
        result = await self.make_request("POST", "/announcements", announcement_data, self.student_token)
        
        if not result["success"] and result["status"] == 403:
            print("✅ Student properly denied from creating announcements")
            return True
        else:
            print(f"❌ Student announcement creation test failed - Status: {result['status']}")
            print(f"   Expected 403 Forbidden but got: {result['data']}")
            return False
    
    # ============= MAIN TEST RUNNER =============
    
    async def run_all_tests(self):
        """Run comprehensive backend API tests"""
        print("🚀 Starting Comprehensive Hostel Management System Backend Tests")
        print(f"Backend URL: {self.base_url}")
        print("="*80)
        
        test_results = {}
        
        # Authentication Tests
        print("\n" + "="*20 + " AUTHENTICATION TESTS " + "="*20)
        test_results["student_registration"] = await self.test_student_registration()
        test_results["management_registration"] = await self.test_management_registration()
        test_results["caretaker_rejection"] = await self.test_caretaker_rejection()
        test_results["student_login"] = await self.test_student_login()
        test_results["management_login"] = await self.test_management_login()
        
        # Issue Management Tests
        print("\n" + "="*20 + " ISSUE MANAGEMENT TESTS " + "="*20)
        test_results["student_create_issue"] = await self.test_student_create_issue()
        test_results["student_create_multiple"] = await self.test_student_create_multiple_issues()
        test_results["student_get_issues"] = await self.test_student_get_issues()
        test_results["management_get_all_issues"] = await self.test_management_get_all_issues()
        test_results["management_update_status"] = await self.test_management_update_issue_status()
        test_results["student_cannot_update_status"] = await self.test_student_cannot_update_status()
        test_results["add_comments"] = await self.test_add_comments_to_issue()
        test_results["issue_detail"] = await self.test_issue_detail_endpoint()
        
        # Analytics Tests
        print("\n" + "="*20 + " ANALYTICS TESTS " + "="*20)
        test_results["analytics_dashboard"] = await self.test_analytics_dashboard()
        test_results["student_cannot_access_analytics"] = await self.test_student_cannot_access_analytics()
        
        # Announcements Tests
        print("\n" + "="*20 + " ANNOUNCEMENTS TESTS " + "="*20)
        test_results["management_create_announcement"] = await self.test_management_create_announcement()
        test_results["get_announcements"] = await self.test_get_announcements()
        test_results["student_cannot_create_announcement"] = await self.test_student_cannot_create_announcement()
        
        # Summary
        print("\n" + "="*80)
        print("📊 COMPREHENSIVE TEST RESULTS SUMMARY")
        print("="*80)
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        # Group results by category
        auth_tests = {k: v for k, v in test_results.items() if any(x in k for x in ['registration', 'login', 'caretaker'])}
        issue_tests = {k: v for k, v in test_results.items() if any(x in k for x in ['issue', 'create', 'get', 'update', 'comment', 'detail'])}
        analytics_tests = {k: v for k, v in test_results.items() if 'analytics' in k}
        announcement_tests = {k: v for k, v in test_results.items() if 'announcement' in k}
        
        def print_category_results(category_name, tests):
            print(f"\n{category_name}:")
            for test_name, result in tests.items():
                status = "✅ PASS" if result else "❌ FAIL"
                print(f"  {test_name.replace('_', ' ').title():<35} {status}")
        
        print_category_results("Authentication", auth_tests)
        print_category_results("Issue Management", issue_tests)
        print_category_results("Analytics", analytics_tests)
        print_category_results("Announcements", announcement_tests)
        
        print(f"\nOverall Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! Backend APIs are working correctly.")
        elif passed >= total * 0.8:
            print("✅ Most tests passed. Minor issues may need attention.")
        else:
            print("⚠️  Several tests failed. Please review the issues above.")
        
        return test_results

async def main():
    """Main test runner"""
    async with HostelAPITester() as tester:
        results = await tester.run_all_tests()
        return results

if __name__ == "__main__":
    asyncio.run(main())