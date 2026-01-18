from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    # 카테고리 색상 정보가 프론트엔드에 있다면 추가해주는 것이 좋습니다.
    color = models.CharField(max_length=7, default="#000000") 

    def __str__(self):
        return self.name

class Task(models.Model):
    title = models.CharField(max_length=200)
    date = models.DateTimeField()  # 시작일은 필수
    end = models.DateTimeField(null=True, blank=True)  # 종료일은 없어도 됨
    
    # 카테고리가 삭제되어도 일정은 남도록 설정
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    
    location = models.CharField(max_length=255, null=True, blank=True)
    location_name = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.title