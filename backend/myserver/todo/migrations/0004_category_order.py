# Generated manually to add drag-and-drop ordering support for Category

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('todo', '0003_category_color_alter_task_category'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='order',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterModelOptions(
            name='category',
            options={'ordering': ['order', 'id']},
        ),
    ]
