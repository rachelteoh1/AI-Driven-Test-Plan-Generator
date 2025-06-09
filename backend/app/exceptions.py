from fastapi import HTTPException

class AppBaseError(HTTPException):
    """Base exception for all application-level errors"""
    pass

class TodoError(HTTPException):
    """Base exception for todo-related errors"""
    pass

class TodoNotFoundError(TodoError):
    def __init__(self, todo_id=None):
        message = "Todo not found" if todo_id is None else f"Todo with id {todo_id} not found"
        super().__init__(status_code=404, detail=message)

class TodoCreationError(TodoError):
    def __init__(self, error: str):
        super().__init__(status_code=500, detail=f"Failed to create todo: {error}")

class UserError(HTTPException):
    """Base exception for user-related errors"""
    pass

class UserNotFoundError(UserError):
    def __init__(self, user_id=None):
        message = "User not found" if user_id is None else f"User with id {user_id} not found"
        super().__init__(status_code=404, detail=message)

class PasswordMismatchError(UserError):
    def __init__(self):
        super().__init__(status_code=400, detail="New passwords do not match")

class InvalidPasswordError(UserError):
    def __init__(self):
        super().__init__(status_code=401, detail="Current password is incorrect")

class AuthenticationError(HTTPException):
    def __init__(self, message: str = "Could not validate user"):
        super().__init__(status_code=401, detail=message)


class ChatError(AppBaseError):
    """Base exception for chat-related operations"""
    pass

class ChatNotFoundError(ChatError):
    def __init__(self, session_id=None):
        message = "Chat not found" if session_id is None else f"Chat with session ID {session_id} not found"
        super().__init__(status_code=404, detail=message)

class ChatCreationError(ChatError):
    def __init__(self, error: str):
        super().__init__(status_code=500, detail=f"Failed to create chat: {error}")

class ChatRenameError(ChatError):
    def __init__(self, session_id):
        super().__init__(status_code=400, detail=f"Failed to rename chat with session ID {session_id}")




class SequenceError(AppBaseError):
    """Base exception for test sequences and SCPI commands"""
    pass

class SequenceNotFoundError(SequenceError):
    def __init__(self, sequence_id=None):
        message = "Sequence not found" if sequence_id is None else f"Sequence with ID {sequence_id} not found"
        super().__init__(status_code=404, detail=message)

class SequenceCreationError(SequenceError):
    def __init__(self, error: str):
        super().__init__(status_code=500, detail=f"Failed to create sequence: {error}")

class CommandCreationError(SequenceError):
    def __init__(self, error: str):
        super().__init__(status_code=500, detail=f"Failed to create SCPI command: {error}")




class DatabaseError(AppBaseError):
    def __init__(self, error: str):
        super().__init__(status_code=500, detail=f"Database error: {error}")

class NotFoundError(AppBaseError):
    def __init__(self, entity: str, entity_id=None):
        message = f"{entity} not found" if entity_id is None else f"{entity} with ID {entity_id} not found"
        super().__init__(status_code=404, detail=message)

class BadRequestError(AppBaseError):
    def __init__(self, reason: str = "Bad request"):
        super().__init__(status_code=400, detail=reason)

class InternalServerError(AppBaseError):
    def __init__(self, error: str):
        super().__init__(status_code=500, detail=f"Internal server error: {error}")