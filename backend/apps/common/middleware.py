import time
import uuid
import logging
from django.utils.deprecation import MiddlewareMixin
from .logging_utils import set_request_context, clear_request_context

logger = logging.getLogger('apps.http')

class RequestIDMiddleware(MiddlewareMixin):
    def process_request(self, request):
        req_id = request.headers.get('X-Request-ID') or uuid.uuid4().hex[:12]
        user_id = getattr(getattr(request, 'user', None), 'id', None)
        set_request_context(req_id=req_id, user_id=str(user_id) if user_id else '-')
        request._req_id = req_id

    def process_response(self, request, response):
        try:
            response['X-Request-ID'] = getattr(request, '_req_id', '-')
        finally:
            clear_request_context()
        return response

class RequestLoggingMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request._start_ts = time.time()
        logger.debug(f"HTTP {request.method} {request.get_full_path()}")

    def process_response(self, request, response):
        try:
            dur_ms = int((time.time() - getattr(request, '_start_ts', time.time())) * 1000)
            status = getattr(response, 'status_code', '-')
            logger.info(f"HTTP {request.method} {request.path} -> {status} ({dur_ms} ms)")
        except Exception:
            pass
        return response
