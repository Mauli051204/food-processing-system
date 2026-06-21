from apps.common.validators import get_safe_page_size


def paginate_queryset(request, queryset, serializer_class, default_page_size=20):
    from django.core.paginator import Paginator

    page_number = request.query_params.get('page', 1)
    page_size = get_safe_page_size(request, default=default_page_size)

    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page_number)

    serializer = serializer_class(page_obj.object_list, many=True)

    return {
        'data': serializer.data,
        'pagination': {
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
            'total_records': paginator.count,
        },
    }


def get_user_display_name(user):
    full_name = f'{user.first_name} {user.last_name}'.strip()
    return full_name or user.username