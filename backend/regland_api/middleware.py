from django.core.cache import cache
from django.http import JsonResponse
from django.conf import settings
from django.db import connection
import hashlib
import json


class ReadOnlyDatabaseMiddleware:
    """
    Middleware to enforce read-only database operations in production.
    Prevents accidental writes to the SQLite database.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # In production (DEBUG=False), set the database connection to read-only
        # This is done per-request to ensure it applies to all database operations
        if not settings.DEBUG:
            # Get the database cursor and set it to read-only mode
            # Note: This is done after the connection is established
            def set_readonly(db_conn):
                with db_conn.cursor() as cursor:
                    cursor.execute("PRAGMA query_only = ON;")
            
            # Apply read-only pragma to the default database
            if 'sqlite3' in settings.DATABASES['default']['ENGINE']:
                try:
                    set_readonly(connection)
                except (AttributeError, RuntimeError):
                    # If the connection hasn't been established yet, it will be set on first use
                    # AttributeError: connection not ready
                    # RuntimeError: database errors
                    pass
        
        response = self.get_response(request)
        return response


class APIResponseCacheMiddleware:
    """
    Simple middleware to cache API responses for performance improvement
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Cache timeout in seconds (5 minutes)
        self.cache_timeout = 300
        
    def __call__(self, request):
        # Only cache GET requests to API endpoints
        if request.method == 'GET' and '/api/' in request.path:
            cache_key = self._generate_cache_key(request)
            
            # Try to get from cache
            cached_response = cache.get(cache_key)
            if cached_response:
                return JsonResponse(cached_response, safe=False)
        
        # Process the request normally
        response = self.get_response(request)
        
        # Cache successful API responses
        if (request.method == 'GET' and 
            '/api/' in request.path and 
            response.status_code == 200 and 
            hasattr(response, 'content')):
            
            try:
                response_data = json.loads(response.content)
                cache_key = self._generate_cache_key(request)
                cache.set(cache_key, response_data, self.cache_timeout)
            except (json.JSONDecodeError, AttributeError):
                # Skip caching if response is not JSON
                pass
        
        return response
    
    def _generate_cache_key(self, request):
        """Generate a unique cache key for the request"""
        # Include path and query parameters
        cache_string = f"{request.path}?{request.GET.urlencode()}"
        return f"api_cache_{hashlib.md5(cache_string.encode()).hexdigest()}"