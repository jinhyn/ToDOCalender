import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions


KAKAO_USER_INFO_URL = "https://kapi.kakao.com/v2/user/me"


class KakaoTokenAuthentication(authentication.BaseAuthentication):
    """Authenticate a request using a Kakao OAuth access token."""

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            raise exceptions.AuthenticationFailed("Invalid bearer token.")

        kakao_user = self._get_kakao_user(token)
        kakao_id = kakao_user.get("id")
        if kakao_id is None:
            raise exceptions.AuthenticationFailed("Kakao user id is missing.")

        User = get_user_model()
        username = f"kakao_{kakao_id}"
        user, created = User.objects.get_or_create(
            username=username,
            defaults={"first_name": self._get_display_name(kakao_user)},
        )

        if created:
            user.set_unusable_password()
            user.save(update_fields=["password"])

        return user, token

    @staticmethod
    def _get_kakao_user(token):
        request = Request(
            KAKAO_USER_INFO_URL,
            headers={"Authorization": f"Bearer {token}"},
            method="GET",
        )
        try:
            with urlopen(request, timeout=5) as response:
                return json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, ValueError) as exc:
            raise exceptions.AuthenticationFailed("Kakao access token is invalid or expired.") from exc

    @staticmethod
    def _get_display_name(kakao_user):
        account = kakao_user.get("kakao_account") or {}
        profile = account.get("profile") or {}
        return profile.get("nickname") or "Kakao User"
