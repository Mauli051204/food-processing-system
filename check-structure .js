// check-structure.js

const fs = require("fs");
const path = require("path");

const REQUIRED_PATHS = [
  "backend/manage.py",
  "backend/requirements.txt",
  "backend/.env",
  "backend/.env.example",

  "backend/config/__init__.py",
  "backend/config/urls.py",
  "backend/config/wsgi.py",
  "backend/config/asgi.py",

  "backend/config/settings/__init__.py",
  "backend/config/settings/base.py",
  "backend/config/settings/development.py",
  "backend/config/settings/production.py",

  "backend/apps/accounts/models.py",
  "backend/apps/accounts/serializers.py",
  "backend/apps/accounts/views.py",
  "backend/apps/accounts/urls.py",
  "backend/apps/accounts/permissions.py",
  "backend/apps/accounts/admin.py",
  "backend/apps/accounts/apps.py",

  "backend/apps/vendors/models.py",
  "backend/apps/vendors/serializers.py",
  "backend/apps/vendors/views.py",
  "backend/apps/vendors/urls.py",
  "backend/apps/vendors/apps.py",

  "backend/apps/purchase/models.py",
  "backend/apps/purchase/serializers.py",
  "backend/apps/purchase/views.py",
  "backend/apps/purchase/urls.py",
  "backend/apps/purchase/apps.py",

  "backend/apps/tech/models.py",
  "backend/apps/tech/serializers.py",
  "backend/apps/tech/views.py",
  "backend/apps/tech/urls.py",
  "backend/apps/tech/apps.py",

  "backend/apps/production/models.py",
  "backend/apps/production/serializers.py",
  "backend/apps/production/views.py",
  "backend/apps/production/urls.py",
  "backend/apps/production/apps.py",

  "backend/apps/encryption/models.py",
  "backend/apps/encryption/services.py",
  "backend/apps/encryption/apps.py",

  "backend/apps/notifications/models.py",
  "backend/apps/notifications/serializers.py",
  "backend/apps/notifications/views.py",
  "backend/apps/notifications/urls.py",
  "backend/apps/notifications/services.py",
  "backend/apps/notifications/apps.py",

  "backend/apps/audit/models.py",
  "backend/apps/audit/serializers.py",
  "backend/apps/audit/views.py",
  "backend/apps/audit/urls.py",
  "backend/apps/audit/middleware.py",
  "backend/apps/audit/services.py",
  "backend/apps/audit/apps.py",

  "backend/apps/dashboard/views.py",
  "backend/apps/dashboard/urls.py",
  "backend/apps/dashboard/apps.py",

  "backend/core/permissions.py",
  "backend/core/pagination.py",
  "backend/core/exceptions.py",
  "backend/core/validators.py",
  "backend/core/utils.py",

  "backend/media/uploads/csv_xlsx",
  "backend/media/uploads/txt",
  "backend/media/uploads/encrypted",

  "backend/tests/test_auth.py",
  "backend/tests/test_vendor.py",
  "backend/tests/test_purchase.py",
  "backend/tests/test_encryption.py",
  "backend/tests/test_production.py",
  "backend/tests/test_notifications.py",

  "frontend/package.json",
  "frontend/.env",
  "frontend/.env.example",

  "frontend/public/index.html",

  "frontend/src/index.js",
  "frontend/src/App.js",

  "frontend/src/api/axiosInstance.js",
  "frontend/src/api/authApi.js",
  "frontend/src/api/vendorApi.js",
  "frontend/src/api/purchaseApi.js",
  "frontend/src/api/techApi.js",
  "frontend/src/api/productionApi.js",
  "frontend/src/api/adminApi.js",
  "frontend/src/api/notificationApi.js",

  "frontend/src/context/AuthContext.js",

  "frontend/src/routes/AppRoutes.js",
  "frontend/src/routes/ProtectedRoute.js",
  "frontend/src/routes/RoleRoute.js",

  "frontend/src/components/common",
  "frontend/src/components/charts",
  "frontend/src/components/forms",

  "frontend/src/pages/auth",
  "frontend/src/pages/admin",
  "frontend/src/pages/vendor",
  "frontend/src/pages/purchase",
  "frontend/src/pages/tech",
  "frontend/src/pages/production",

  "frontend/src/styles/custom.css",

  "frontend/src/utils/constants.js",
  "frontend/src/utils/helpers.js"
];

let found = 0;
let missing = 0;

console.log("\n========== PROJECT STRUCTURE CHECK ==========\n");

REQUIRED_PATHS.forEach((item) => {
  if (fs.existsSync(item)) {
    console.log(`✅ ${item}`);
    found++;
  } else {
    console.log(`❌ ${item}`);
    missing++;
  }
});

console.log("\n=============================================");
console.log(`✅ Found   : ${found}`);
console.log(`❌ Missing : ${missing}`);
console.log("=============================================\n");

if (missing === 0) {
  console.log("🎉 All required files/folders exist!");
} else {
  console.log("⚠️ Some files/folders are missing.");
}