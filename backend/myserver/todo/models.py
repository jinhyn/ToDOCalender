from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name

class Task(models.Model):
    title = models.CharField(max_length=200)
    date = models.DateTimeField()
    end = models.DateTimeField(null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)  # 위치 정보
    location_name = models.CharField(max_length=255, blank=True, null=True)  # 위치 이름

    def __str__(self):
        return self.title
