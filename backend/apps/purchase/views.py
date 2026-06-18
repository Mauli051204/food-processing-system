from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404

from .models import Material, ApprovedMaterial, RejectedMaterial, UploadBatch
from .permissions import IsPurchaseTeam
from .serializers import (
    VendorRequestListSerializer,
    VendorDetailSerializer,
    MaterialReviewSerializer,
    EditMaterialSerializer,
    ApproveMaterialSerializer,
    RejectMaterialSerializer,
    ApprovedMaterialSerializer,
    RejectedMaterialSerializer,
    SendToTechSerializer,
)
from .services import (
    get_purchase_dashboard_stats,
    get_recent_requests,
    get_pending_materials_for_vendor,
    edit_material,
    approve_material,
    reject_material,
    send_approved_materials_to_tech,
)
from .utils import paginate_queryset
from apps.vendors.models import VendorRequest
from apps.accounts.models import User


class PurchaseDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsPurchaseTeam]

    def get(self, request):
        stats = get_purchase_dashboard_stats()
        recent = get_recent_requests()
        return Response({
            'success': True,
            'stats': stats,
            'recent_requests': VendorRequestListSerializer(recent, many=True).data,
        }, status=status.HTTP_200_OK)


class VendorRequestsView(APIView):
    permission_classes = [IsAuthenticated, IsPurchaseTeam]

    def get(self, request):
        queryset = VendorRequest.objects.select_related('vendor').order_by('-requested_at')

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(vendor__first_name__icontains=search) | queryset.filter(
                vendor__vendor_profile__company_name__icontains=search
            )

        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())

        results = []
        for req in queryset:
            company_name = ''
            if hasattr(req.vendor, 'vendor_profile'):
                company_name = req.vendor.vendor_profile.company_name
            results.append({
                'id': req.id,
                'vendor_id': req.vendor.id,
                'vendor_name': f'{req.vendor.first_name} {req.vendor.last_name}'.strip() or req.vendor.username,
                'company': company_name,
                'upload_date': req.requested_at,
                'status': req.status,
            })

        page_number = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 20)
        from django.core.paginator import Paginator
        paginator = Paginator(results, page_size)
        page_obj = paginator.get_page(page_number)

        return Response({
            'success': True,
            'data': page_obj.object_list,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_records': paginator.count,
            },
        }, status=status.HTTP_200_OK)


class VendorDetailView(APIView):
    permission_classes = [IsAuthenticated, IsPurchaseTeam]

    def get(self, request, vendor_id):
        vendor = get_object_or_404(User, id=vendor_id, role__name='VENDOR')

        profile = getattr(vendor, 'vendor_profile', None)
        materials = Material.objects.filter(vendor=vendor)
        batches = UploadBatch.objects.filter(vendor=vendor).order_by('-created_at')

        total_imported = sum(b.imported_rows for b in batches)
        total_rejected = sum(b.rejected_rows for b in batches)

        data = {
            'vendor_id': vendor.id,
            'full_name': f'{vendor.first_name} {vendor.last_name}'.strip() or vendor.username,
            'email': vendor.email,
            'phone': vendor.phone or '',
            'company_name': profile.company_name if profile else '',
            'address': profile.address if profile else None,
            'total_materials': materials.count(),
            'imported_rows': total_imported,
            'rejected_rows': total_rejected,
            'upload_history': [
                {
                    'file_name': b.original_filename,
                    'uploaded_at': b.created_at,
                    'rows_imported': b.imported_rows,
                    'rows_rejected': b.rejected_rows,
                }
                for b in batches
            ],
        }

        serializer = VendorDetailSerializer(data)
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)


class MaterialReviewView(APIView):
    permission_classes = [IsAuthenticated, IsPurchaseTeam]

    def get(self, request):
        queryset = Material.objects.select_related('vendor').order_by('-created_at')

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(material_name__icontains=search)

        supplier = request.query_params.get('supplier')
        if supplier:
            queryset = queryset.filter(supplier__icontains=supplier)

        vendor_id = request.query_params.get('vendor_id')
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)

        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())

        sort_by = request.query_params.get('sort_by', '-created_at')
        allowed_sorts = ['material_name', '-material_name', 'expiry_date', '-expiry_date', 'created_at', '-created_at']
        if sort_by in allowed_sorts:
            queryset = queryset.order_by(sort_by)

        result = paginate_queryset(request, queryset, MaterialReviewSerializer)
        return Response({'success': True, **result}, status=status.HTTP_200_OK)


class EditMaterialView(APIView):
    permission_classes = [IsAuthenticated, IsPurchaseTeam]

    def put(self, request, material_id):
        material = get_object_or_404(Material, id=material_id)
        serializer = EditMaterialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated = edit_material(
                material,
                request.user,
                new_quantity=serializer.validated_data.get('quantity'),
                new_cost=serializer.validated_data.get('cost'),
            )
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'message': 'Material updated successfully.',
            'data': MaterialReviewSerializer(updated).data,
        }, status=status.HTTP_200_OK)


class ApproveMaterialView(APIView):
    permission_classes = [IsAuthenticated, IsPurchaseTeam]

    def post(self, request, material_id):
        material = get_object_or_404(Material, id=material_id)
        serializer = ApproveMaterialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            approved = approve_material(
                material,
                request.user,
                edited_quantity=serializer.validated_data.get('edited_quantity'),
                edited_cost=serializer.validated_data.get('edited_cost'),
                remarks=serializer.validated_data.get('remarks', ''),
            )
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'message': 'Material approved successfully.',
            'data': ApprovedMaterialSerializer(approved).data,
        }, status=status.HTTP_200_OK)


class RejectMaterialView(APIView):
    permission_classes = [IsAuthenticated, IsPurchaseTeam]

    def post(self, request, material_id):
        material = get_object_or_404(Material, id=material_id)
        serializer = RejectMaterialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            rejected = reject_material(material, request.user, serializer.validated_data['reason'])
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'message': 'Material rejected successfully.',
            'data': RejectedMaterialSerializer(rejected).data,
        }, status=status.HTTP_200_OK)


class ApprovedMaterialsView(APIView):
    permission_classes = [IsAuthenticated, IsPurchaseTeam]

    def get(self, request):
        queryset = ApprovedMaterial.objects.select_related('material', 'purchase_user').order_by('-approved_at')
        result = paginate_queryset(request, queryset, ApprovedMaterialSerializer)
        return Response({'success': True, **result}, status=status.HTTP_200_OK)


class RejectedMaterialsView(APIView):
    permission_classes = [IsAuthenticated, IsPurchaseTeam]

    def get(self, request):
        queryset = RejectedMaterial.objects.select_related('material', 'purchase_user').order_by('-rejected_at')
        result = paginate_queryset(request, queryset, RejectedMaterialSerializer)
        return Response({'success': True, **result}, status=status.HTTP_200_OK)


class SendToTechView(APIView):
    permission_classes = [IsAuthenticated, IsPurchaseTeam]

    def post(self, request):
        serializer = SendToTechSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            count = send_approved_materials_to_tech(
                request.user,
                serializer.validated_data['approved_material_ids'],
            )
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'message': f'{count} material(s) sent to Tech Team.',
        }, status=status.HTTP_200_OK)