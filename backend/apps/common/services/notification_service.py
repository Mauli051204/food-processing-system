"""
Single source of truth for notification creation and retrieval.

Every module that needs to notify a user MUST call notify() from this
module rather than creating Notification rows directly. This mirrors
the Shared Key Request Service pattern from the Refactor Phase: thin
call sites, one fat service, one implementation.
"""
import logging
from typing import Optional

from django.db import transaction
from django.db.models import QuerySet
from django.core.paginator import Paginator

from apps.notifications.models import Notification


logger = logging.getLogger('notification_service')


def notify(
    user,
    title: str,
    message: str,
    notification_type: str = 'INFO',
    related_object_id: Optional[int] = None,
) -> Notification:
    """
    Create a single notification for one user.

    notification_type is passed through as-is (no validation against a
    fixed vocabulary) so existing call sites across Purchase, Tech,
    Production, and Admin can keep using their original type strings
    (e.g. 'PURCHASE_APPROVAL', 'TECH_NEW_MATERIALS') without any
    behavior change from before this phase.

    Does NOT write an audit log entry — notification creation is
    considered part of the business action that triggered it (e.g.
    "Material Approved"), which already has its own AuditLog entry at
    the call site. Logging the notification itself would double the
    audit volume for every approve/reject/send action in the system.

    Args:
        user: the User who should receive this notification.
        title: short notification title.
        message: full notification body.
        notification_type: free-form type string, used by the frontend
            for badge styling/icons.
        related_object_id: optional FK-like reference (e.g. a KeyRequest
            id) for the frontend to deep-link against.

    Returns:
        The created Notification instance.
    """
    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        related_object_id=related_object_id,
    )

    logger.info('Notification created for %s: "%s" (%s).', user.email, title, notification_type)
    return notification


def notify_many(users, title: str, message: str, notification_type: str = 'INFO', related_object_id: Optional[int] = None) -> list:
    """
    Convenience helper for notifying multiple users with the same
    title/message (e.g. all Admins). Calls notify() once per user —
    no batch-insert optimization, since notification volume here is
    low (a handful of admins/team members, not thousands of rows).
    """
    return [notify(u, title, message, notification_type, related_object_id) for u in users]


def get_notifications_for_user(user, read_filter: Optional[str] = None, search: Optional[str] = None,
                                  type_filter: Optional[str] = None, date_from=None, date_to=None,
                                  sort: str = 'newest') -> QuerySet:
    """
    Returns the queryset of notifications belonging to ONE user, with
    optional filters. This is the only function that should ever be
    used to fetch a user's notifications — it guarantees the
    user-scoping that prevents cross-user notification leakage.
    """
    queryset = Notification.objects.filter(user=user)

    if read_filter == 'unread':
        queryset = queryset.filter(is_read=False)
    elif read_filter == 'read':
        queryset = queryset.filter(is_read=True)

    if search:
        queryset = queryset.filter(title__icontains=search) | queryset.filter(message__icontains=search)

    if type_filter:
        queryset = queryset.filter(notification_type=type_filter.upper())

    if date_from:
        queryset = queryset.filter(created_at__gte=date_from)
    if date_to:
        queryset = queryset.filter(created_at__lte=date_to)

    if sort == 'oldest':
        queryset = queryset.order_by('created_at')
    else:
        queryset = queryset.order_by('-created_at')

    return queryset


def get_unread_count(user) -> int:
    return Notification.objects.filter(user=user, is_read=False).count()


def get_latest(user, limit: int = 5) -> QuerySet:
    return Notification.objects.filter(user=user).order_by('-created_at')[:limit]


def mark_read(notification: Notification, acting_user) -> Notification:
    """Mark a single notification as read. Caller must verify ownership before calling this."""
    if notification.is_read:
        return notification

    notification.is_read = True
    notification.save(update_fields=['is_read'])
    return notification


@transaction.atomic
def mark_all_read(user) -> int:
    """Marks every unread notification for this user as read. Returns count updated."""
    unread = Notification.objects.filter(user=user, is_read=False)
    count = unread.count()
    unread.update(is_read=True)
    return count


def delete_notification(notification: Notification, acting_user) -> None:
    """Delete a single notification. Caller must verify ownership before calling this."""
    notification.delete()


@transaction.atomic
def delete_all_read(user) -> int:
    """Deletes every read notification for this user. Returns count deleted."""
    read_qs = Notification.objects.filter(user=user, is_read=True)
    count = read_qs.count()
    read_qs.delete()
    return count


def paginate(queryset: QuerySet, page: int = 1, page_size: int = 20) -> dict:
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    return {
        'items': page_obj.object_list,
        'pagination': {
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
            'total_records': paginator.count,
        },
    }