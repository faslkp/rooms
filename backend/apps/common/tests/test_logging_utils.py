from django.test import TestCase
import logging

from apps.common.logging_utils import (
    RequestContextFilter,
    SensitiveDataFilter,
    set_request_context,
    clear_request_context
)


class RequestContextFilterTest(TestCase):
    """Test RequestContextFilter"""
    
    def setUp(self):
        self.filter = RequestContextFilter()
    
    def test_adds_request_id(self):
        """Test filter adds req_id to log record"""
        set_request_context(req_id='test-req-123')
        record = logging.LogRecord(
            name='test',
            level=logging.INFO,
            pathname='test.py',
            lineno=1,
            msg='Test message',
            args=(),
            exc_info=None
        )
        self.filter.filter(record)
        self.assertEqual(record.req_id, 'test-req-123')
    
    def test_adds_user_id(self):
        """Test filter adds user_id to log record"""
        set_request_context(user_id='5')
        record = logging.LogRecord(
            name='test',
            level=logging.INFO,
            pathname='test.py',
            lineno=1,
            msg='Test message',
            args=(),
            exc_info=None
        )
        self.filter.filter(record)
        self.assertEqual(record.user_id, '5')
    
    def test_adds_room_id(self):
        """Test filter adds room_id to log record"""
        set_request_context(room_id='10')
        record = logging.LogRecord(
            name='test',
            level=logging.INFO,
            pathname='test.py',
            lineno=1,
            msg='Test message',
            args=(),
            exc_info=None
        )
        self.filter.filter(record)
        self.assertEqual(record.room_id, '10')
    
    def test_default_values(self):
        """Test filter uses default values when context not set"""
        clear_request_context()
        record = logging.LogRecord(
            name='test',
            level=logging.INFO,
            pathname='test.py',
            lineno=1,
            msg='Test message',
            args=(),
            exc_info=None
        )
        self.filter.filter(record)
        self.assertEqual(record.req_id, '-')
        self.assertEqual(record.user_id, '-')
        self.assertEqual(record.room_id, '-')


class SensitiveDataFilterTest(TestCase):
    """Test SensitiveDataFilter"""
    
    def setUp(self):
        self.filter = SensitiveDataFilter()
    
    def test_masks_password(self):
        """Test filter masks password in log message"""
        record = logging.LogRecord(
            name='test',
            level=logging.INFO,
            pathname='test.py',
            lineno=1,
            msg='password=secret123',
            args=(),
            exc_info=None
        )
        self.filter.filter(record)
        self.assertIn('***', record.msg)
        self.assertNotIn('secret123', record.msg)
    
    def test_masks_token(self):
        """Test filter masks token in log message"""
        record = logging.LogRecord(
            name='test',
            level=logging.INFO,
            pathname='test.py',
            lineno=1,
            msg='token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
            args=(),
            exc_info=None
        )
        self.filter.filter(record)
        self.assertIn('***', record.msg)
        self.assertNotIn('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', record.msg)
    
    def test_masks_authorization_header(self):
        """Test filter masks Authorization header"""
        record = logging.LogRecord(
            name='test',
            level=logging.INFO,
            pathname='test.py',
            lineno=1,
            msg='Authorization=Bearer token123',
            args=(),
            exc_info=None
        )
        self.filter.filter(record)
        # Check that the header value is masked
        self.assertIn('***', record.msg)
        # Verify token123 is masked (should be replaced with ***)
        # The pattern should match "Authorization=Bearer token123" and replace with "Authorization=***"
        self.assertTrue(record.msg.startswith('Authorization='))
        self.assertNotIn('token123', record.msg)
    
    def test_preserves_non_sensitive_data(self):
        """Test filter preserves non-sensitive data"""
        record = logging.LogRecord(
            name='test',
            level=logging.INFO,
            pathname='test.py',
            lineno=1,
            msg='user_id=5 room_id=10 action=create',
            args=(),
            exc_info=None
        )
        original_msg = record.msg
        self.filter.filter(record)
        # Non-sensitive fields should still be present
        self.assertIn('user_id=5', record.msg)
        self.assertIn('room_id=10', record.msg)
        self.assertIn('action=create', record.msg)


class LoggingUtilsTest(TestCase):
    """Test logging utility functions"""
    
    def test_set_request_context(self):
        """Test set_request_context sets values"""
        set_request_context(req_id='req-1', user_id='5', room_id='10')
        from apps.common.logging_utils import _local
        self.assertEqual(_local.req_id, 'req-1')
        self.assertEqual(_local.user_id, '5')
        self.assertEqual(_local.room_id, '10')
    
    def test_clear_request_context(self):
        """Test clear_request_context removes values"""
        set_request_context(req_id='req-1', user_id='5', room_id='10')
        clear_request_context()
        from apps.common.logging_utils import _local
        self.assertFalse(hasattr(_local, 'req_id'))
        self.assertFalse(hasattr(_local, 'user_id'))
        self.assertFalse(hasattr(_local, 'room_id'))
    
    def test_partial_context_set(self):
        """Test set_request_context can set partial context"""
        set_request_context(req_id='req-1')
        from apps.common.logging_utils import _local
        self.assertEqual(_local.req_id, 'req-1')
        self.assertFalse(hasattr(_local, 'user_id'))

