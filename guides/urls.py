from django.urls import path

from . import views

urlpatterns = [
    path("me/", views.me),
    path("register/", views.register),
    path("login/", views.login_view),
    path("logout/", views.logout_view),
    path("bootstrap/", views.bootstrap),
    path("sg-calculator/", views.sg_calculator),
    path("options/", views.options_collection),
    path("options/<int:option_id>/", views.option_detail),
    path("options/<int:option_id>/rate/", views.option_rate),
    path("cases/", views.cases_collection),
    path("cases/<int:case_id>/", views.case_detail),
    path("cases/<int:case_id>/rate/", views.case_rate),
    path("events/", views.events_collection),
]
