# Azure 자동 배포

GitHub Actions가 다음 순서로 배포합니다.

1. Resource Group 생성 또는 갱신
2. `foundation.bicep`으로 ACR Basic, Container Apps 환경, MySQL Flexible Server(B1ms), Azure Files 5GiB 구성
3. 백엔드·프론트·DB 초기화 이미지를 ACR에 빌드·푸시
4. `apps.bicep`으로 내부 API, 외부 프론트, 수동 DB 초기화 Job 배포
5. DB 초기화 Job 실행 후 프론트와 DB health 확인

`apps.bicep`은 기존 Container Apps Managed Certificate
`metrip.kro.kr-metrotri-260812232706`을 `existing` 리소스로 참조하고 frontend ingress에
`metrip.kro.kr`을 `SniEnabled`로 선언합니다. 따라서 Bicep 재배포 후에도 사용자 지정 도메인
바인딩이 유지되며, Container Apps 기본 `*.azurecontainerapps.io` 주소도 함께 사용할 수 있습니다.

Container Apps는 최소 replica 0, 최대 1로 제한합니다. MySQL, ACR, Storage, Log Analytics는 별도 과금되며 워크플로 실행 전에 비용 승인이 필요합니다.

## GitHub 설정

Environment `azure-production`에 다음 값을 등록합니다.

| 종류 | 이름 | 설명 |
|---|---|---|
| Secret | `AZURE_CLIENT_ID` | GitHub OIDC용 Entra 애플리케이션 client ID |
| Secret | `AZURE_TENANT_ID` | Azure tenant ID |
| Secret | `AZURE_SUBSCRIPTION_ID` | 학생 구독 ID |
| Secret | `MYSQL_ADMIN_PASSWORD` | URL 예약문자 없이 영문·숫자 조합 12자 이상 권장 |
| Secret | `METROTRIP_JWT_SECRET` | 32자 이상 임의 문자열 |
| Variable | `AZURE_RESOURCE_GROUP` | 예: `rg-metrotrip-dev` |
| Variable | `AZURE_LOCATION` | 예: `koreacentral` |
| Variable | `AZURE_NAME_PREFIX` | 3~12자 소문자/숫자, 예: `metrotrip` |
| Variable | `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오 JavaScript 키 |

OIDC 주체에는 대상 Resource Group을 만들고 배포할 권한이 필요합니다. 최초 실행은 Actions의 `Azure deploy`를 수동 실행하고, 이후 `main` push가 같은 배포를 갱신합니다.

> 워크플로는 실제 유료 Azure 리소스를 만듭니다. 저장소 준비와 별개로 첫 실행 전 사용자의 승인이 필요합니다.
