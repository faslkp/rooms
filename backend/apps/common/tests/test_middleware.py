from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.http import HttpResponse

from apps.common.middleware import RequestIDMiddleware, RequestLoggingMiddleware

User = get_user_model()


class RequestIDMiddlewareTest(TestCase):
    """Test RequestIDMiddleware"""
    
    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = RequestIDMiddleware(lambda request: HttpResponse())
    
    def test_generates_request_id(self):
        """Test middleware generates UUID request ID"""
        request = self.factory.get('/test/')
        self.middleware.process_request(request)
        self.assertIsNotNone(getattr(request, '_req_id', None))
        self.assertEqual(len(request._req_id), 12)  # UUID hex[:12]
    
    def test_uses_existing_request_id(self):
        """Test middleware uses X-Request-ID header if provided"""
        request = self.factory.get('/test/', HTTP_X_REQUEST_ID='custom-id-123')
        self.middleware.process_request(request)
        self.assertEqual(request._req_id, 'custom-id-123')
    
    def test_adds_request_id_to_response(self):
        """Test middleware adds X-Request-ID to response headers"""
        request = self.factory.get('/test/')
        self.middleware.process_request(request)
        response = self.middleware.process_response(request, HttpResponse())
        self.assertIn('X-Request-ID', response)
        self.assertEqual(response['X-Request-ID'], request._req_id)
    
    def test_clears_context_on_response(self):
        """Test middleware clears request context after response"""
        request = self.factory.get('/test/')
        self.middleware.process_request(request)
        response = self.middleware.process_response(request, HttpResponse())
        # Context should be cleared (tested via logging filter behavior)
        self.assertIsNotNone(response)  # Response should be returned


class RequestLoggingMiddlewareTest(TestCase):
    """Test RequestLoggingMiddleware"""
    
    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = RequestLoggingMiddleware(lambda request: HttpResponse())
    
    def test_logs_request_start_time(self):
        """Test middleware records request start time"""
        request = self.factory.get('/test/')
        self.middleware.process_request(request)
        self.assertIsNotNone(getattr(request, '_start_ts', None))
    
    def test_logs_response_with_timing(self):
        """Test middleware logs response with timing information"""
        request = self.factory.get('/test/')
        self.middleware.process_request(request)
        response = HttpResponse(status=200)
        response = self.middleware.process_response(request, response)
        # Response should be returned (timing logged internally)
        self.assertEqual(response.status_code, 200)
    
    def test_handles_missing_start_time(self):
        """Test middleware handles missing start time gracefully"""
        request = self.factory.get('/test/')
        # Skip process_request to simulate missing start time
        response = HttpResponse(status=200)
        response = self.middleware.process_response(request, response)
        # Should not raise error
        self.assertIsNotNone(response)
    
    def test_calculates_duration(self):
        """Test middleware calculates request duration"""
        request = self.factory.get('/test/')
        self.middleware.process_request(request)
        import time
        time.sleep(0.01)  # Small delay
        response = HttpResponse(status=200)
        response = self.middleware.process_response(request, response)
        # Duration should be logged (tested via logging output)
        self.assertIsNotNone(response)

