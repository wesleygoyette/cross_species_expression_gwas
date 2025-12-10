"""
URL configuration for regland_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

def api_root(request):
    return JsonResponse({
        'message': 'Regland API',
        'version': '1.0',
        'endpoints': {
            'genes': '/api/genes/',
            'plots': '/api/plots/',
            'species': '/api/species/',
            'health': '/health/'
        }
    })

@csrf_exempt
def health_check(request):
    """Health check endpoint for monitoring"""
    return JsonResponse({
        'status': 'healthy',
        'service': 'regland_backend'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('regland_api.urls')),
    path('health/', health_check, name='health_check'),
    path('', api_root, name='api_root'),
]
