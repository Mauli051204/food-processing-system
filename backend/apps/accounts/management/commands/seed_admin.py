from django.core.management.base import BaseCommand
from apps.accounts.models import User, Role


class Command(BaseCommand):
    help = 'Seed roles and hardcoded admin user'

    def handle(self, *args, **options):
        roles = ['ADMIN', 'VENDOR', 'PURCHASE', 'TECH', 'PRODUCTION']
        for r in roles:
            Role.objects.get_or_create(name=r)

        admin_role = Role.objects.get(name='ADMIN')

        if not User.objects.filter(email='admin@gmail.com').exists():
            user = User.objects.create_superuser(
                username='admin',
                email='admin@gmail.com',
                password='admin',
            )
            user.role = admin_role
            user.is_approved = True
            user.is_active = True
            user.save()
            self.stdout.write(self.style.SUCCESS('Admin user created.'))
        else:
            self.stdout.write(self.style.WARNING('Admin user already exists.'))