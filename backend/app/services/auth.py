"""DB V1.8 기반 인증 서비스."""

import base64
import hashlib
import hmac
import json
import logging
import secrets
import smtplib
from datetime import UTC, datetime, timedelta
from email.message import EmailMessage

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import Settings

logger = logging.getLogger(__name__)


def _error(code: str, message: str, status_code: int) -> HTTPException:
    return HTTPException(status_code, detail=message, headers={"X-Error-Code": code})


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return "scrypt$16384$8$1$" + salt.hex() + "$" + derived.hex()


def _verify_password(password: str, stored: str) -> bool:
    try:
        _, n, r, p, salt_hex, digest_hex = stored.split("$")
        derived = hashlib.scrypt(
            password.encode(),
            salt=bytes.fromhex(salt_hex),
            n=int(n),
            r=int(r),
            p=int(p),
        )
        return hmac.compare_digest(derived.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def _hash_code(code: str, settings: Settings) -> str:
    return hmac.new(
        settings.jwt_secret.encode(), code.encode(), hashlib.sha256
    ).hexdigest()


def _sign_token(payload: dict[str, object], secret: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}

    def encode(value: object) -> str:
        return (
            base64.urlsafe_b64encode(json.dumps(value, separators=(",", ":")).encode())
            .rstrip(b"=")
            .decode()
        )

    body = encode(header) + "." + encode(payload)
    signature = hmac.new(secret.encode(), body.encode(), hashlib.sha256).digest()
    return body + "." + base64.urlsafe_b64encode(signature).rstrip(b"=").decode()


def _decode_token(token: str, secret: str) -> dict[str, object]:
    try:
        header, body, signature = token.split(".")
        signed = header + "." + body
        expected = (
            base64.urlsafe_b64encode(
                hmac.new(secret.encode(), signed.encode(), hashlib.sha256).digest()
            )
            .rstrip(b"=")
            .decode()
        )
        if not hmac.compare_digest(signature, expected):
            raise ValueError
        body += "=" * (-len(body) % 4)
        payload = json.loads(base64.urlsafe_b64decode(body))
        if int(payload["exp"]) <= int(datetime.now(UTC).timestamp()):
            raise ValueError
        return payload
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        raise _error(
            "INVALID_TOKEN", "유효하지 않거나 만료된 인증 토큰입니다.", 401
        ) from None


def _send_code(email: str, code: str, settings: Settings) -> None:
    if settings.email_mode == "console":
        logger.warning("[MetroTrip] 이메일 인증 코드 recipient=%s code=%s", email, code)
        return
    if not all(
        (
            settings.smtp_host,
            settings.smtp_username,
            settings.smtp_password,
            settings.smtp_from,
        )
    ):
        raise _error("EMAIL_CONFIG_MISSING", "이메일 발송 설정이 없습니다.", 500)
    message = EmailMessage()
    message["Subject"] = "MetroTrip 이메일 인증 코드"
    message["From"] = settings.smtp_from
    message["To"] = email
    message.set_content(f"MetroTrip 인증 코드는 {code}입니다. 5분 이내에 입력해주세요.")
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)


def request_verification(
    db: Session, email: str, purpose: str, settings: Settings
) -> None:
    email = email.strip().lower()
    user = db.execute(
        text("SELECT user_id FROM users WHERE email = :email"), {"email": email}
    ).first()
    if purpose == "PASSWORD_RESET" and user is None:
        return
    code = f"{secrets.randbelow(1_000_000):06d}"
    expires = datetime.now(UTC).replace(tzinfo=None) + timedelta(
        minutes=settings.verification_code_expire_minutes
    )
    db.execute(
        text("""
        INSERT INTO email_verifications (user_id, email, purpose, code_hash, expires_at)
        VALUES (:user_id, :email, :purpose, :code_hash, :expires_at)
    """),
        {
            "user_id": user.user_id if user else None,
            "email": email,
            "purpose": purpose,
            "code_hash": _hash_code(code, settings),
            "expires_at": expires,
        },
    )
    db.commit()
    try:
        _send_code(email, code, settings)
    except Exception:
        db.rollback()
        raise


def confirm_verification(db: Session, request, settings: Settings) -> str:
    email = request.email.strip().lower()
    row = (
        db.execute(
            text("""
        SELECT verification_id, code_hash, expires_at, attempt_count
        FROM email_verifications
        WHERE email = :email AND purpose = :purpose AND verified_at IS NULL
        ORDER BY verification_id DESC LIMIT 1
    """),
            {"email": email, "purpose": request.purpose},
        )
        .mappings()
        .first()
    )
    if not row or row["attempt_count"] >= settings.verification_max_attempts:
        raise _error("INVALID_VERIFICATION_CODE", "인증 코드가 유효하지 않습니다.", 400)
    if row["expires_at"] < datetime.now(UTC).replace(tzinfo=None):
        raise _error("VERIFICATION_CODE_EXPIRED", "인증 코드가 만료되었습니다.", 400)
    if not hmac.compare_digest(row["code_hash"], _hash_code(request.code, settings)):
        db.execute(
            text(
                "UPDATE email_verifications SET attempt_count = attempt_count + 1 WHERE verification_id = :id"
            ),
            {"id": row["verification_id"]},
        )
        db.commit()
        raise _error("INVALID_VERIFICATION_CODE", "인증 코드가 유효하지 않습니다.", 400)
    db.execute(
        text(
            "UPDATE email_verifications SET verified_at = NOW() WHERE verification_id = :id"
        ),
        {"id": row["verification_id"]},
    )
    db.commit()
    exp = int((datetime.now(UTC) + timedelta(minutes=10)).timestamp())
    return _sign_token(
        {"email": email, "purpose": request.purpose, "exp": exp}, settings.jwt_secret
    )


def register(db: Session, request, settings: Settings):
    if request.password != request.password_confirm:
        raise _error("PASSWORD_MISMATCH", "비밀번호가 일치하지 않습니다.", 400)
    if not request.terms_agreed or not request.privacy_agreed:
        raise _error("REQUIRED_AGREEMENT", "필수 약관에 동의해야 합니다.", 400)
    verification = _decode_token(request.email_verification_token, settings.jwt_secret)
    email = request.email.strip().lower()
    if verification.get("email") != email or verification.get("purpose") != "SIGNUP":
        raise _error("EMAIL_NOT_VERIFIED", "이메일 인증이 필요합니다.", 400)
    if db.execute(
        text("SELECT 1 FROM users WHERE email = :email"), {"email": email}
    ).first():
        raise _error("EMAIL_ALREADY_EXISTS", "이미 가입된 이메일입니다.", 409)
    if db.execute(
        text("SELECT 1 FROM users WHERE nickname = :nickname"),
        {"nickname": request.nickname},
    ).first():
        raise _error("NICKNAME_ALREADY_EXISTS", "이미 사용 중인 닉네임입니다.", 409)
    try:
        result = db.execute(
            text("""
            INSERT INTO users (email, password, name, nickname, phone)
            VALUES (:email, :password, :name, :nickname, :phone)
        """),
            {
                "email": email,
                "password": _hash_password(request.password),
                "name": request.name,
                "nickname": request.nickname,
                "phone": request.phone.replace("-", "") if request.phone else None,
            },
        )
        user_id = result.lastrowid
        for agreement in ("TERMS", "PRIVACY"):
            db.execute(
                text(
                    "INSERT INTO user_agreements (user_id, agreement_type, is_agreed) VALUES (:user_id, :type, 1)"
                ),
                {"user_id": user_id, "type": agreement},
            )
        db.execute(
            text(
                "UPDATE email_verifications SET user_id = :user_id WHERE email = :email AND purpose = 'SIGNUP' AND verified_at IS NOT NULL AND user_id IS NULL"
            ),
            {"user_id": user_id, "email": email},
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _error(
            "DUPLICATE_USER", "이미 사용 중인 이메일 또는 닉네임입니다.", 409
        ) from None
    return {"user_id": user_id, "email": email, "nickname": request.nickname}


def _tokens(db: Session, user_id: int, settings: Settings) -> dict[str, object]:
    now = datetime.now(UTC)
    access = _sign_token(
        {
            "sub": str(user_id),
            "exp": int(
                (
                    now + timedelta(minutes=settings.access_token_expire_minutes)
                ).timestamp()
            ),
        },
        settings.jwt_secret,
    )
    refresh = secrets.token_urlsafe(64)
    db.execute(
        text(
            "INSERT INTO auth_tokens (user_id, refresh_token, issued_at, expires_at) VALUES (:user_id, :token, :issued, :expires)"
        ),
        {
            "user_id": user_id,
            "token": hashlib.sha256(refresh.encode()).hexdigest(),
            "issued": now.replace(tzinfo=None),
            "expires": (
                now + timedelta(days=settings.refresh_token_expire_days)
            ).replace(tzinfo=None),
        },
    )
    db.commit()
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
    }


def login(db: Session, request, settings: Settings) -> dict[str, object]:
    email = request.email.strip().lower()
    row = (
        db.execute(
            text("SELECT user_id, password FROM users WHERE email = :email"),
            {"email": email},
        )
        .mappings()
        .first()
    )
    if (
        not row
        or not row["password"]
        or not _verify_password(request.password, row["password"])
    ):
        raise _error(
            "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.", 401
        )
    return _tokens(db, row["user_id"], settings)


def authenticate_access(token: str, settings: Settings) -> int:
    payload = _decode_token(token, settings.jwt_secret)
    try:
        return int(payload["sub"])
    except (KeyError, ValueError):
        raise _error("INVALID_TOKEN", "유효하지 않은 인증 토큰입니다.", 401) from None


def refresh(db: Session, refresh_token: str, settings: Settings) -> dict[str, object]:
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    row = (
        db.execute(
            text(
                "SELECT user_id FROM auth_tokens WHERE refresh_token = :token AND revoked_at IS NULL AND expires_at > NOW()"
            ),
            {"token": token_hash},
        )
        .mappings()
        .first()
    )
    if not row:
        raise _error("INVALID_REFRESH_TOKEN", "유효하지 않은 갱신 토큰입니다.", 401)
    db.execute(
        text("UPDATE auth_tokens SET revoked_at = NOW() WHERE refresh_token = :token"),
        {"token": token_hash},
    )
    db.commit()
    return _tokens(db, row["user_id"], settings)


def logout(db: Session, user_id: int, settings: Settings) -> None:
    db.execute(
        text(
            "UPDATE auth_tokens SET revoked_at = NOW() WHERE user_id = :user_id AND revoked_at IS NULL"
        ),
        {"user_id": user_id},
    )
    db.commit()
