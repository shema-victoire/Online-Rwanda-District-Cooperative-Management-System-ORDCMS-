#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Rwanda District Cooperative Management System
Tests all API endpoints, authentication, role-based access control, and data validation
"""

import requests
import json
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Get backend URL from frontend .env file
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def log_pass(self, test_name):
        print(f"✅ PASS: {test_name}")
        self.passed += 1
        
    def log_fail(self, test_name, error):
        print(f"❌ FAIL: {test_name} - {error}")
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed")
        print(f"{'='*60}")
        if self.errors:
            print("FAILURES:")
            for error in self.errors:
                print(f"  - {error}")
        return self.failed == 0

# Global test results
results = TestResults()

# Test data
test_users = {
    'district_official': {
        'email': 'john.uwimana@gov.rw',
        'password': 'SecurePass123!',
        'full_name': 'John Uwimana',
        'role': 'district_official',
        'district': 'Kigali',
        'phone': '+250788123456'
    },
    'cooperative_leader': {
        'email': 'marie.mukamana@coop.rw',
        'password': 'LeaderPass456!',
        'full_name': 'Marie Mukamana',
        'role': 'cooperative_leader',
        'district': 'Kigali',
        'phone': '+250788654321'
    },
    'member': {
        'email': 'paul.nkurunziza@member.rw',
        'password': 'MemberPass789!',
        'full_name': 'Paul Nkurunziza',
        'role': 'member',
        'district': 'Kigali',
        'phone': '+250788987654'
    }
}

test_cooperative = {
    'name': 'Ubwiyunge Cooperative',
    'description': 'Agricultural cooperative focused on coffee production and processing',
    'district': 'Kigali',
    'sector': 'Gasabo',
    'cell': 'Kimisagara',
    'village': 'Nyamirambo',
    'leader_id': ''  # Will be filled with cooperative leader's ID
}

# Store tokens and user IDs for testing
tokens = {}
user_ids = {}

def test_health_check():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'healthy':
                results.log_pass("Health check endpoint")
                return True
            else:
                results.log_fail("Health check endpoint", f"Unexpected response: {data}")
        else:
            results.log_fail("Health check endpoint", f"Status code: {response.status_code}")
    except Exception as e:
        results.log_fail("Health check endpoint", f"Connection error: {str(e)}")
    return False

def test_user_registration():
    """Test user registration for all roles"""
    for role, user_data in test_users.items():
        try:
            response = requests.post(
                f"{API_BASE}/auth/register",
                json=user_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data and 'user' in data:
                    tokens[role] = data['access_token']
                    user_ids[role] = data['user']['id']
                    results.log_pass(f"User registration - {role}")
                else:
                    results.log_fail(f"User registration - {role}", "Missing token or user data")
            else:
                error_detail = response.json().get('detail', 'Unknown error') if response.content else f"Status {response.status_code}"
                results.log_fail(f"User registration - {role}", error_detail)
        except Exception as e:
            results.log_fail(f"User registration - {role}", f"Request error: {str(e)}")

def test_duplicate_registration():
    """Test that duplicate email registration is prevented"""
    try:
        # Try to register the same user again
        response = requests.post(
            f"{API_BASE}/auth/register",
            json=test_users['district_official'],
            timeout=10
        )
        
        if response.status_code == 400:
            data = response.json()
            if 'already registered' in data.get('detail', '').lower():
                results.log_pass("Duplicate email prevention")
            else:
                results.log_fail("Duplicate email prevention", f"Wrong error message: {data.get('detail')}")
        else:
            results.log_fail("Duplicate email prevention", f"Expected 400, got {response.status_code}")
    except Exception as e:
        results.log_fail("Duplicate email prevention", f"Request error: {str(e)}")

def test_user_login():
    """Test user login functionality"""
    for role, user_data in test_users.items():
        try:
            # Use form data for OAuth2PasswordRequestForm
            login_data = {
                'username': user_data['email'],
                'password': user_data['password']
            }
            
            response = requests.post(
                f"{API_BASE}/auth/login",
                data=login_data,  # Use data instead of json for form data
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data and 'user' in data:
                    # Update token in case it's different
                    tokens[role] = data['access_token']
                    results.log_pass(f"User login - {role}")
                else:
                    results.log_fail(f"User login - {role}", "Missing token or user data")
            else:
                error_detail = response.json().get('detail', 'Unknown error') if response.content else f"Status {response.status_code}"
                results.log_fail(f"User login - {role}", error_detail)
        except Exception as e:
            results.log_fail(f"User login - {role}", f"Request error: {str(e)}")

def test_invalid_login():
    """Test login with invalid credentials"""
    try:
        login_data = {
            'username': 'invalid@email.com',
            'password': 'wrongpassword'
        }
        
        response = requests.post(
            f"{API_BASE}/auth/login",
            data=login_data,
            timeout=10
        )
        
        if response.status_code == 401:
            results.log_pass("Invalid login rejection")
        else:
            results.log_fail("Invalid login rejection", f"Expected 401, got {response.status_code}")
    except Exception as e:
        results.log_fail("Invalid login rejection", f"Request error: {str(e)}")

def test_protected_route_access():
    """Test that protected routes require authentication"""
    for role in test_users.keys():
        if role not in tokens:
            continue
            
        try:
            headers = {'Authorization': f'Bearer {tokens[role]}'}
            response = requests.get(
                f"{API_BASE}/auth/me",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('role') == role:
                    results.log_pass(f"Protected route access - {role}")
                else:
                    results.log_fail(f"Protected route access - {role}", f"Wrong role returned: {data.get('role')}")
            else:
                results.log_fail(f"Protected route access - {role}", f"Status code: {response.status_code}")
        except Exception as e:
            results.log_fail(f"Protected route access - {role}", f"Request error: {str(e)}")

def test_unauthorized_access():
    """Test that routes reject invalid tokens"""
    try:
        headers = {'Authorization': 'Bearer invalid_token'}
        response = requests.get(
            f"{API_BASE}/auth/me",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 401:
            results.log_pass("Unauthorized access rejection")
        else:
            results.log_fail("Unauthorized access rejection", f"Expected 401, got {response.status_code}")
    except Exception as e:
        results.log_fail("Unauthorized access rejection", f"Request error: {str(e)}")

def test_cooperative_creation():
    """Test cooperative creation with proper authorization"""
    # Set leader_id for the test cooperative
    if 'cooperative_leader' in user_ids:
        test_cooperative['leader_id'] = user_ids['cooperative_leader']
    
    # Test with cooperative leader (should work)
    if 'cooperative_leader' in tokens:
        try:
            headers = {'Authorization': f'Bearer {tokens["cooperative_leader"]}'}
            response = requests.post(
                f"{API_BASE}/cooperatives",
                json=test_cooperative,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('name') == test_cooperative['name']:
                    results.log_pass("Cooperative creation - authorized user")
                    # Store cooperative ID for later tests
                    global test_cooperative_id
                    test_cooperative_id = data.get('id')
                else:
                    results.log_fail("Cooperative creation - authorized user", "Invalid response data")
            else:
                error_detail = response.json().get('detail', 'Unknown error') if response.content else f"Status {response.status_code}"
                results.log_fail("Cooperative creation - authorized user", error_detail)
        except Exception as e:
            results.log_fail("Cooperative creation - authorized user", f"Request error: {str(e)}")
    
    # Test with member (should fail)
    if 'member' in tokens:
        try:
            headers = {'Authorization': f'Bearer {tokens["member"]}'}
            response = requests.post(
                f"{API_BASE}/cooperatives",
                json=test_cooperative,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 403:
                results.log_pass("Cooperative creation - unauthorized user rejection")
            else:
                results.log_fail("Cooperative creation - unauthorized user rejection", f"Expected 403, got {response.status_code}")
        except Exception as e:
            results.log_fail("Cooperative creation - unauthorized user rejection", f"Request error: {str(e)}")

def test_cooperative_listing():
    """Test cooperative listing with role-based filtering"""
    for role in ['district_official', 'cooperative_leader', 'member']:
        if role not in tokens:
            continue
            
        try:
            headers = {'Authorization': f'Bearer {tokens[role]}'}
            response = requests.get(
                f"{API_BASE}/cooperatives",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    results.log_pass(f"Cooperative listing - {role}")
                else:
                    results.log_fail(f"Cooperative listing - {role}", "Response is not a list")
            else:
                results.log_fail(f"Cooperative listing - {role}", f"Status code: {response.status_code}")
        except Exception as e:
            results.log_fail(f"Cooperative listing - {role}", f"Request error: {str(e)}")

def test_cooperative_approval():
    """Test cooperative approval by district official"""
    if 'district_official' not in tokens:
        results.log_fail("Cooperative approval - district official", "No district official token available")
        return
    
    # First, create a cooperative to approve
    if 'cooperative_leader' in tokens:
        try:
            # Create a new cooperative for approval testing
            approval_test_coop = test_cooperative.copy()
            approval_test_coop['name'] = 'Test Approval Cooperative'
            
            headers = {'Authorization': f'Bearer {tokens["cooperative_leader"]}'}
            response = requests.post(
                f"{API_BASE}/cooperatives",
                json=approval_test_coop,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                coop_data = response.json()
                coop_id = coop_data.get('id')
                
                # Now try to approve it with district official
                headers = {'Authorization': f'Bearer {tokens["district_official"]}'}
                response = requests.put(
                    f"{API_BASE}/cooperatives/{coop_id}/approve",
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if 'registration_number' in data:
                        results.log_pass("Cooperative approval - district official")
                    else:
                        results.log_fail("Cooperative approval - district official", "No registration number in response")
                else:
                    error_detail = response.json().get('detail', 'Unknown error') if response.content else f"Status {response.status_code}"
                    results.log_fail("Cooperative approval - district official", error_detail)
            else:
                results.log_fail("Cooperative approval - district official", "Failed to create test cooperative")
        except Exception as e:
            results.log_fail("Cooperative approval - district official", f"Request error: {str(e)}")
    
    # Test unauthorized approval (member trying to approve)
    if 'member' in tokens and 'test_cooperative_id' in globals():
        try:
            headers = {'Authorization': f'Bearer {tokens["member"]}'}
            response = requests.put(
                f"{API_BASE}/cooperatives/{test_cooperative_id}/approve",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 403:
                results.log_pass("Cooperative approval - unauthorized user rejection")
            else:
                results.log_fail("Cooperative approval - unauthorized user rejection", f"Expected 403, got {response.status_code}")
        except Exception as e:
            results.log_fail("Cooperative approval - unauthorized user rejection", f"Request error: {str(e)}")

def test_data_validation():
    """Test data validation for various endpoints"""
    if 'cooperative_leader' not in tokens:
        return
    
    # Test invalid email format in registration
    try:
        invalid_user = test_users['member'].copy()
        invalid_user['email'] = 'invalid-email-format'
        
        response = requests.post(
            f"{API_BASE}/auth/register",
            json=invalid_user,
            timeout=10
        )
        
        if response.status_code == 422:  # Pydantic validation error
            results.log_pass("Email format validation")
        else:
            results.log_fail("Email format validation", f"Expected 422, got {response.status_code}")
    except Exception as e:
        results.log_fail("Email format validation", f"Request error: {str(e)}")
    
    # Test missing required fields in cooperative creation
    try:
        invalid_coop = {'name': 'Incomplete Coop'}  # Missing required fields
        
        headers = {'Authorization': f'Bearer {tokens["cooperative_leader"]}'}
        response = requests.post(
            f"{API_BASE}/cooperatives",
            json=invalid_coop,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 422:  # Pydantic validation error
            results.log_pass("Required fields validation")
        else:
            results.log_fail("Required fields validation", f"Expected 422, got {response.status_code}")
    except Exception as e:
        results.log_fail("Required fields validation", f"Request error: {str(e)}")

def run_all_tests():
    """Run all backend tests in sequence"""
    print("🚀 Starting Rwanda District Cooperative Management System Backend Tests")
    print(f"Testing against: {API_BASE}")
    print("="*60)
    
    # Basic connectivity and health
    if not test_health_check():
        print("❌ Health check failed - stopping tests")
        return False
    
    # Authentication tests
    test_user_registration()
    test_duplicate_registration()
    test_user_login()
    test_invalid_login()
    test_protected_route_access()
    test_unauthorized_access()
    
    # Cooperative management tests
    test_cooperative_creation()
    test_cooperative_listing()
    test_cooperative_approval()
    
    # Data validation tests
    test_data_validation()
    
    # Final summary
    return results.summary()

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)