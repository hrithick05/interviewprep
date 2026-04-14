from django.contrib import admin
from django.urls import path, include

# 🔥 ADD THESE
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Django auth (login/logout)
    path('accounts/', include('django.contrib.auth.urls')),

    # Main app
    path('', include('main.urls')),
]

# 🔥 VERY IMPORTANT (FOR IMAGE UPLOAD)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)