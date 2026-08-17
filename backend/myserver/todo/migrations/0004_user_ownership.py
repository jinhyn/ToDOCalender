from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def assign_existing_data_to_legacy_user(apps, schema_editor):
    User = apps.get_model("auth", "User")
    Category = apps.get_model("todo", "Category")
    Task = apps.get_model("todo", "Task")

    legacy_user, _ = User.objects.get_or_create(
        username="legacy_migrated_data",
        defaults={"first_name": "Migrated Data"},
    )
    legacy_user.set_unusable_password()
    legacy_user.save(update_fields=["password"])

    Category.objects.filter(user__isnull=True).update(user=legacy_user)
    Task.objects.filter(user__isnull=True).update(user=legacy_user)


def reverse_ownership(apps, schema_editor):
    Category = apps.get_model("todo", "Category")
    Task = apps.get_model("todo", "Task")
    Category.objects.all().update(user=None)
    Task.objects.all().update(user=None)


class Migration(migrations.Migration):
    dependencies = [
        ("todo", "0003_category_color_alter_task_category"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="category",
            name="user",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="categories",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="task",
            name="user",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="tasks",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(assign_existing_data_to_legacy_user, reverse_ownership),
        migrations.AlterField(
            model_name="category",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="categories",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="task",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="tasks",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddConstraint(
            model_name="category",
            constraint=models.UniqueConstraint(
                fields=("user", "name"),
                name="unique_category_name_per_user",
            ),
        ),
    ]
