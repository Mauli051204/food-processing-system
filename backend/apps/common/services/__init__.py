"""
Cross-cutting services shared by multiple apps. Unlike app-specific
services (e.g. apps.production.services), code here has no single
natural domain owner — notifications are created by every module in
the system, so the service lives at this shared layer rather than
inside any one app.
"""