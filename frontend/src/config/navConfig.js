import {
  FiGrid, FiUser, FiUpload, FiClock, FiCheckCircle, FiXCircle, FiBell, FiBarChart2,
  FiUsers, FiUserCheck, FiKey, FiLock, FiDownload, FiFileText, FiSettings, FiPackage,
} from 'react-icons/fi';

export const NAV_CONFIG = {
  vendor: {
    label: 'Vendor Panel',
    basePath: '/vendor',
    items: [
      { to: 'dashboard', label: 'Dashboard', icon: FiGrid },
      { to: 'profile', label: 'Profile', icon: FiUser },
      { to: 'upload', label: 'Upload Material', icon: FiUpload },
      { to: 'upload-history', label: 'Upload History', icon: FiClock },
      { to: 'approved-materials', label: 'Approved Materials', icon: FiCheckCircle },
      { to: 'rejected-materials', label: 'Rejected Materials', icon: FiXCircle },
      { to: 'notifications', label: 'Notifications', icon: FiBell },
      { to: 'statistics', label: 'Statistics', icon: FiBarChart2 },
    ],
  },
    purchase: {
    label: 'Purchase Panel',
    basePath: '/purchase',
    items: [
        { to: 'dashboard', label: 'Dashboard', icon: FiGrid },
        { to: 'vendor-requests', label: 'Vendor Requests', icon: FiUsers },
        { to: 'material-review', label: 'Material Review', icon: FiPackage },
        { to: 'approved-materials', label: 'Approved Materials', icon: FiCheckCircle },
        { to: 'rejected-materials', label: 'Rejected Materials', icon: FiXCircle },
        { to: 'notifications', label: 'Notifications', icon: FiBell },
        { to: 'statistics', label: 'Statistics', icon: FiBarChart2 },
      ],
    },
  tech: {
    label: 'Tech Panel',
    basePath: '/tech',
    items: [
      { to: 'dashboard', label: 'Dashboard', icon: FiGrid },
      { to: 'received-materials', label: 'Received Materials', icon: FiPackage },
      { to: 'encryption-history', label: 'Encryption History', icon: FiLock },
      { to: 'notifications', label: 'Notifications', icon: FiBell },
      { to: 'statistics', label: 'Statistics', icon: FiBarChart2 },
    ],
  },
  production: {
    label: 'Production Panel',
    basePath: '/production',
    items: [
      { to: 'dashboard', label: 'Dashboard', icon: FiGrid },
      { to: 'encrypted-files', label: 'Encrypted Files', icon: FiLock },
      { to: 'key-requests', label: 'Key Requests', icon: FiKey },
      { to: 'download-history', label: 'Download History', icon: FiDownload },
      { to: 'notifications', label: 'Notifications', icon: FiBell },
    ],
  },
  admin: {
    label: 'Admin Panel',
    basePath: '/admin',
    items: [
      { to: 'dashboard', label: 'Dashboard', icon: FiGrid },
      { to: 'users', label: 'Users', icon: FiUsers },
      { to: 'pending-approvals', label: 'Pending Approvals', icon: FiUserCheck },
      { to: 'key-requests', label: 'Key Requests', icon: FiKey },
      { to: 'encryption-history', label: 'Encryption History', icon: FiLock },
      { to: 'download-history', label: 'Download History', icon: FiDownload },
      { to: 'audit-logs', label: 'Audit Logs', icon: FiFileText },
      { to: 'notifications', label: 'Notifications', icon: FiBell },
      { to: 'reports', label: 'Reports', icon: FiBarChart2 },
      { to: 'system-settings', label: 'System Settings', icon: FiSettings },
    ],
  },
};