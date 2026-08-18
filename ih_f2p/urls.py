from django.urls import include, path, re_path

from guides.views import spa_assets, spa_index

urlpatterns = [
    path("api/", include("guides.urls")),
    re_path(r"^assets/(?P<path>.*)$", spa_assets),
    re_path(r"^(?!api/).*$", spa_index),
]
