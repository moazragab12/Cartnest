from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    user = "user"


class ItemStatus(str, Enum):
    for_sale = "for_sale"
    sold = "sold"
    removed = "removed"
    draft = "draft"