from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError

from .permissions import IsTechTeam
from .serializers import (
    ReceivedBatchSerializer,
    EncryptedFileSerializer,
    GenerateTxtRequestSerializer,
    EncryptBatchRequestSerializer,
)
from .services import (
    get_tech_dashboard_stats,
    group_received_materials_by_batch,
    generate_txt_for_batch,
    encrypt_batch,
    get_encryption_history,
    get_encryption_trend,
    get_encryption_status_breakdown,
    get_tech_statistics,
)
from .utils import media_path
from apps.tech.models import EncryptedFile
from apps.common.validators import get_safe_page_size, get_safe_days, get_safe_search


class TechDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsTechTeam]

    def get(self, request):
        stats = get_tech_dashboard_stats()
        recent = get_encryption_history()[:10]
        return Response({
            'success': True,
            'stats': stats,
            'recent_encryptions': EncryptedFileSerializer(recent, many=True).data,
        }, status=status.HTTP_200_OK)


class ReceivedMaterialsView(APIView):
    permission_classes = [IsAuthenticated, IsTechTeam]

    def get(self, request):
        batches = group_received_materials_by_batch()

        search = get_safe_search(request)
        if search:
            batches = [b for b in batches if search.lower() in b['vendor_name'].lower()]

        return Response({
            'success': True,
            'data': ReceivedBatchSerializer(batches, many=True).data,
        }, status=status.HTTP_200_OK)


class GenerateTxtView(APIView):
    permission_classes = [IsAuthenticated, IsTechTeam]

    def post(self, request, batch_id):
        try:
            result = generate_txt_for_batch(batch_id, request.user)
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'message': 'TXT file generated successfully.',
            'data': result,
        }, status=status.HTTP_201_CREATED)


class EncryptBatchView(APIView):
    permission_classes = [IsAuthenticated, IsTechTeam]

    def post(self, request, batch_id):
        try:
            result = encrypt_batch(batch_id, request.user)
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'message': 'File encrypted successfully.',
            'data': result,
        }, status=status.HTTP_200_OK)


class EncryptionHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsTechTeam]

    def get(self, request):
        from django.core.paginator import Paginator

        search = get_safe_search(request)
        vendor_id = request.query_params.get('vendor_id')
        status_filter = request.query_params.get('status')

        queryset = get_encryption_history(search=search, vendor_id=vendor_id, status_filter=status_filter)

        page_number = request.query_params.get('page', 1)
        page_size = get_safe_page_size(request)
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page_number)

        return Response({
            'success': True,
            'data': EncryptedFileSerializer(page_obj.object_list, many=True).data,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_records': paginator.count,
            },
        }, status=status.HTTP_200_OK)


class EncryptionDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTechTeam]

    def get(self, request, pk):
        from django.shortcuts import get_object_or_404
        encrypted_file = get_object_or_404(EncryptedFile, id=pk)
        return Response({
            'success': True,
            'data': EncryptedFileSerializer(encrypted_file).data,
        }, status=status.HTTP_200_OK)


class EncryptedFilesListView(APIView):
    permission_classes = [IsAuthenticated, IsTechTeam]

    def get(self, request):
        queryset = EncryptedFile.objects.select_related(
            'approved_material__material__vendor'
        ).order_by('-created_at')

        return Response({
            'success': True,
            'data': EncryptedFileSerializer(queryset, many=True).data,
        }, status=status.HTTP_200_OK)


class EncryptionTrendView(APIView):
    permission_classes = [IsAuthenticated, IsTechTeam]

    def get(self, request):
        days = get_safe_days(request)
        trend = get_encryption_trend(days=days)
        return Response({'success': True, 'data': trend}, status=status.HTTP_200_OK)


class EncryptionStatusBreakdownView(APIView):
    permission_classes = [IsAuthenticated, IsTechTeam]

    def get(self, request):
        breakdown = get_encryption_status_breakdown()
        return Response({'success': True, 'data': breakdown}, status=status.HTTP_200_OK)


class TechStatisticsView(APIView):
    permission_classes = [IsAuthenticated, IsTechTeam]

    def get(self, request):
        stats = get_tech_statistics()
        return Response({'success': True, 'data': stats}, status=status.HTTP_200_OK)