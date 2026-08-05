"""Current user and favorite API contracts."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.auth import AuthRepository
from app.routers.contract import (
    AUTH_REQUIRED,
    ERROR_RESPONSES,
    CurrentUserId,
    not_implemented,
)
from app.schemas.common import MessageResponse
from app.schemas.reviews import ReviewListResponse
from app.schemas.users import (
    FavoriteListResponse,
    FavoriteResponse,
    UserProfileResponse,
    UserProfileUpdateRequest,
    WithdrawRequest,
)
from app.services import reviews as review_service

router = APIRouter(
    prefix="/users/me",
    tags=["사용자"],
    dependencies=AUTH_REQUIRED,
)
DatabaseSession = Annotated[Session, Depends(get_db)]


@router.get(
    "",
    response_model=UserProfileResponse,
    summary="내 회원 정보 조회",
    responses=ERROR_RESPONSES,
)
def get_my_profile(user_id: CurrentUserId, db: DatabaseSession) -> UserProfileResponse:
    """Access Token의 사용자가 현재도 존재하는지 확인하고 프로필을 반환한다."""
    user = AuthRepository(db).find_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="사용자를 찾을 수 없습니다.",
            headers={"X-Error-Code": "USER_NOT_FOUND"},
        )
    return UserProfileResponse.model_validate(user)


@router.patch(
    "",
    response_model=UserProfileResponse,
    summary="내 회원 정보 수정",
    responses=ERROR_RESPONSES,
)
def update_my_profile(_: UserProfileUpdateRequest) -> JSONResponse:
    return not_implemented()


@router.delete(
    "",
    response_model=MessageResponse,
    summary="회원 탈퇴",
    responses=ERROR_RESPONSES,
)
def withdraw(_: WithdrawRequest) -> JSONResponse:
    return not_implemented()


@router.get(
    "/favorites",
    response_model=FavoriteListResponse,
    summary="즐겨찾기한 역 목록 조회",
    responses=ERROR_RESPONSES,
)
def list_favorites() -> JSONResponse:
    return not_implemented()


@router.post(
    "/favorites/{station_id}",
    response_model=FavoriteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="역 즐겨찾기 추가",
    responses=ERROR_RESPONSES,
)
def add_favorite(station_id: int) -> JSONResponse:
    return not_implemented()


@router.delete(
    "/favorites/{station_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="역 즐겨찾기 삭제",
    responses=ERROR_RESPONSES,
)
def delete_favorite(station_id: int) -> JSONResponse:
    return not_implemented()


@router.get(
    "/reviews",
    response_model=ReviewListResponse,
    summary="내가 작성한 후기 목록 조회",
    responses=ERROR_RESPONSES,
)
def list_my_reviews(
    user_id: CurrentUserId,
    db: DatabaseSession,
    page: int = 1,
    size: int = 20,
) -> ReviewListResponse:
    """현재 로그인한 사용자가 작성한 후기 목록을 반환한다."""
    return review_service.list_reviews(
        db,
        user_id=user_id,
        keyword=None,
        station_id=None,
        tag=None,
        page=page,
        size=size,
    )
