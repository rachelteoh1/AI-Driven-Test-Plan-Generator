from fastapi import FastAPI
from .auth.controller import router as auth_router
from .users.controller import router as users_router
from .chat_logs.controller import router as chat_logs_router
from .chat_session.controller import router as chat_session_router
from .optimized_test_sequence.controller import router as optimized_test_sequence_router
from .dashboard import controller as dashboard_controller
from .profile.controller import router as profile_router


def register_routes(app: FastAPI):
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(chat_logs_router)
    app.include_router(chat_session_router)
    app.include_router(optimized_test_sequence_router)
    app.include_router(dashboard_controller.router)
    app.include_router(profile_router)