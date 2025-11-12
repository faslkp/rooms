import logging
import re
import threading

_local = threading.local()

SENSITIVE_KEYS = {"password", "confirm_password", "token", "refresh", "authorization"}

class RequestContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.req_id = getattr(_local, 'req_id', '-')
        record.user_id = getattr(_local, 'user_id', '-')
        record.room_id = getattr(_local, 'room_id', '-')
        return True

class SensitiveDataFilter(logging.Filter):
    header_re = re.compile(r"(Authorization|Cookie)\s*=\s*[^\s,;]+(?:\s+[^\s,;]+)*", re.IGNORECASE)

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            msg = str(record.getMessage())
        except TypeError:
            msg = str(record.msg % record.args if record.args else record.msg)
        
        msg = self.header_re.sub(r"\1=***", msg)
        for key in SENSITIVE_KEYS:
            pattern = re.compile(r'(\"?' + re.escape(key) + r'\"?\s*[:=]\s*)(\".*?\"|[^,}\s]+)', re.IGNORECASE)
            msg = pattern.sub(r'\1***', msg)
        msg = re.sub(r'\btoken\w+\b', '***', msg, flags=re.IGNORECASE)
        record.msg = msg
        record.args = ()
        return True


def set_request_context(req_id: str = None, user_id: str = None, room_id: str = None):
    if req_id is not None:
        _local.req_id = req_id
    if user_id is not None:
        _local.user_id = user_id
    if room_id is not None:
        _local.room_id = room_id


def clear_request_context():
    for k in ('req_id', 'user_id', 'room_id'):
        if hasattr(_local, k):
            delattr(_local, k)
