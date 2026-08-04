"""회원가입, 로그인, 이메일 인증 API."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.routers.contract import AUTH_REQUIRED, ERROR_RESPONSES, bearer_scheme
from app.schemas.auth import (
    EmailVerificationConfirmRequest,
    EmailVerificationConfirmResponse,
    EmailVerificationRequest,
    LoginRequest,
    PasswordResetConfirmRequest,
    RefreshRequest,
    RegisteredUserResponse,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.common import MessageResponse
from app.services import auth

router = APIRouter(prefix="/auth", tags=["인증"])


@router.post(
    "/register",
    response_model=RegisteredUserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="회원가입",
    responses=ERROR_RESPONSES,
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),  # noqa: B008
) -> RegisteredUserResponse:
    return auth.register(db, request, get_settings())


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="로그인",
    responses=ERROR_RESPONSES,
)
def login(request: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:  # noqa: B008
    return auth.login(db, request, get_settings())


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Access Token 갱신",
    responses=ERROR_RESPONSES,
)
def refresh_token(
    request: RefreshRequest,
    db: Session = Depends(get_db),  # noqa: B008
) -> TokenResponse:
    return auth.refresh(db, request.refresh_token, get_settings())


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="로그아웃",
    dependencies=AUTH_REQUIRED,
    responses=ERROR_RESPONSES,
)
def logout(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Session = Depends(get_db),  # noqa: B008
) -> MessageResponse:
    auth.logout(
        db,
        auth.authenticate_access(credentials.credentials, get_settings()),
        get_settings(),
    )
    return {"message": "로그아웃되었습니다."}


@router.post(
    "/email-verifications",
    response_model=MessageResponse,
    status_code=202,
    responses=ERROR_RESPONSES,
)
def request_email_verification(
    request: EmailVerificationRequest,
    db: Session = Depends(get_db),  # noqa: B008
) -> MessageResponse:
    auth.request_verification(db, request.email, request.purpose, get_settings())
    return {"message": "인증 코드를 발송했습니다."}


@router.post(
    "/password-reset/requests",
    response_model=MessageResponse,
    status_code=202,
    responses=ERROR_RESPONSES,
)
def request_password_reset(
    request: EmailVerificationRequest,
    db: Session = Depends(get_db),  # noqa: B008
) -> MessageResponse:
    auth.request_verification(db, request.email, "PASSWORD_RESET", get_settings())
    return {"message": "입력한 이메일로 비밀번호 재설정 코드를 발송했습니다."}


@router.post(
    "/email-verifications/confirm",
    response_model=EmailVerificationConfirmResponse,
    responses=ERROR_RESPONSES,
)
def confirm_email_verification(
    request: EmailVerificationConfirmRequest,
    db: Session = Depends(get_db),  # noqa: B008
) -> EmailVerificationConfirmResponse:
    return {
        "verification_token": auth.confirm_verification(db, request, get_settings())
    }


@router.post(
    "/password-reset/confirm", response_model=MessageResponse, responses=ERROR_RESPONSES
)
def confirm_password_reset(
    request: PasswordResetConfirmRequest,
    db: Session = Depends(get_db),  # noqa: B008
) -> MessageResponse:
    request.purpose = "PASSWORD_RESET"
    if request.new_password != request.new_password_confirm:
        from fastapi import HTTPException

        raise HTTPException(
            400,
            detail="비밀번호가 일치하지 않습니다.",
            headers={"X-Error-Code": "PASSWORD_MISMATCH"},
        )
    token = auth.confirm_verification(db, request, get_settings())
    payload = auth._decode_token(token, get_settings().jwt_secret)
    user = (
        db.execute(
            text("SELECT user_id FROM users WHERE email = :email"),
            {"email": payload["email"]},
        )
        .mappings()
        .first()
    )
    if not user:
        from fastapi import HTTPException

        raise HTTPException(
            400,
            detail="비밀번호를 변경할 수 없습니다.",
            headers={"X-Error-Code": "USER_NOT_FOUND"},
        )
    db.execute(
        text("UPDATE users SET password = :password WHERE user_id = :user_id"),
        {
            "password": auth._hash_password(request.new_password),
            "user_id": user["user_id"],
        },
    )
    db.execute(
        text(
            "UPDATE auth_tokens SET revoked_at = NOW() WHERE user_id = :user_id AND revoked_at IS NULL"
        ),
        {"user_id": user["user_id"]},
    )
    db.commit()
    return {"message": "비밀번호가 변경되었습니다."}
