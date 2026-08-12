targetScope = 'resourceGroup'

param namePrefix string = 'metrotrip'
param location string = resourceGroup().location
param environmentName string
param acrName string
param imageTag string
param mysqlHost string
param mysqlAdminUser string
param frontendCustomDomain string = 'metrip.kro.kr'
param frontendManagedCertificateName string = 'metrip.kro.kr-metrotri-260812232706'

@secure()
param mysqlAdminPassword string

@secure()
param databaseUrl string

@secure()
param jwtSecret string

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: environmentName
}

resource frontendManagedCertificate 'Microsoft.App/managedEnvironments/managedCertificates@2024-03-01' existing = {
  parent: environment
  name: frontendManagedCertificateName
}

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: acrName
}

var acrCredentials = acr.listCredentials()
var acrPassword = acrCredentials.passwords[0].value
var apiName = '${namePrefix}-api'
var frontendName = '${namePrefix}-web'

resource api 'Microsoft.App/containerApps@2024-03-01' = {
  name: apiName
  location: location
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: false
        targetPort: 8000
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acrCredentials.username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        { name: 'acr-password', value: acrPassword }
        { name: 'database-url', value: databaseUrl }
        { name: 'jwt-secret', value: jwtSecret }
      ]
    }
    template: {
      containers: [
        {
          name: 'api'
          image: '${acr.properties.loginServer}/metrotrip-backend:${imageTag}'
          env: [
            { name: 'METROTRIP_APP_ENV', value: 'production' }
            { name: 'METROTRIP_DATABASE_URL', secretRef: 'database-url' }
            { name: 'METROTRIP_SSL_CA_PATH', value: '/etc/ssl/certs/ca-certificates.crt' }
            { name: 'METROTRIP_JWT_SECRET', secretRef: 'jwt-secret' }
            { name: 'METROTRIP_CORS_ORIGINS', value: '[]' }
            { name: 'METROTRIP_MEDIA_ROOT_DIR', value: '/app/media' }
            { name: 'METROTRIP_EMAIL_MODE', value: 'console' }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          volumeMounts: [
            { volumeName: 'media', mountPath: '/app/media' }
          ]
          probes: [
            { type: 'Liveness', httpGet: { path: '/health', port: 8000 }, periodSeconds: 30 }
            { type: 'Readiness', httpGet: { path: '/health', port: 8000 }, periodSeconds: 10 }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
      }
      volumes: [
        { name: 'media', storageName: 'media', storageType: 'AzureFile' }
      ]
    }
  }
}

resource frontend 'Microsoft.App/containerApps@2024-03-01' = {
  name: frontendName
  location: location
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 5173
        transport: 'auto'
        allowInsecure: false
        customDomains: [
          {
            name: frontendCustomDomain
            certificateId: frontendManagedCertificate.id
            bindingType: 'SniEnabled'
          }
        ]
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acrCredentials.username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        { name: 'acr-password', value: acrPassword }
      ]
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: '${acr.properties.loginServer}/metrotrip-frontend:${imageTag}'
          env: [
            { name: 'API_INTERNAL_BASE_URL', value: 'https://${api.properties.configuration.ingress.fqdn}' }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          probes: [
            { type: 'Liveness', httpGet: { path: '/', port: 5173 }, periodSeconds: 30 }
            { type: 'Readiness', httpGet: { path: '/', port: 5173 }, periodSeconds: 10 }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
      }
    }
  }
}

resource dbInit 'Microsoft.App/jobs@2024-03-01' = {
  name: '${namePrefix}-db-init'
  location: location
  properties: {
    environmentId: environment.id
    configuration: {
      triggerType: 'Manual'
      replicaTimeout: 1800
      replicaRetryLimit: 1
      manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 }
      registries: [
        {
          server: acr.properties.loginServer
          username: acrCredentials.username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        { name: 'acr-password', value: acrPassword }
        { name: 'mysql-password', value: mysqlAdminPassword }
      ]
    }
    template: {
      containers: [
        {
          name: 'db-init'
          image: '${acr.properties.loginServer}/metrotrip-db-init:${imageTag}'
          env: [
            { name: 'MYSQL_HOST', value: mysqlHost }
            { name: 'MYSQL_USER', value: mysqlAdminUser }
            { name: 'MYSQL_PASSWORD', secretRef: 'mysql-password' }
          ]
          resources: { cpu: json('0.5'), memory: '1Gi' }
        }
      ]
    }
  }
}

output frontendUrl string = 'https://${frontend.properties.configuration.ingress.fqdn}'
output dbInitJobName string = dbInit.name
