# Import all models so that Base has them registered before being imported by Alembic
from backend.db.base_class import Base # noqa
from backend.models.user import User # noqa
from backend.models.project import Project # noqa
from backend.models.document import Document # noqa
from backend.models.analysis import Analysis # noqa
from backend.models.finding import Finding # noqa
from backend.models.score import Score # noqa
from backend.models.report import Report # noqa
from backend.models.chat import ChatSession, ChatMessage # noqa
from backend.models.framework import FrameworkRegistry # noqa
from backend.models.audit import AuditLog # noqa
