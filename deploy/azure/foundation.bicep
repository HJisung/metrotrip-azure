targetScope = 'resourceGroup'

@description('모든 Azure 리소스 이름에 사용할 짧은 접두사')
@minLength(3)
@maxLength(12)
param namePrefix string = 'metrotrip'

@description('Azure 리전')
param location string = resourceGroup().location

@secure()
@description('MySQL 관리자 암호')
param mysqlAdminPassword string

param mysqlAdminUser string = 'metrotripadmin'

var uniqueSuffix = uniqueString(subscription().subscriptionId, resourceGroup().id)
var acrName = toLower(take(replace('${namePrefix}${uniqueSuffix}', '-', ''), 50))
var storageName = toLower(take(replace('${namePrefix}${uniqueSuffix}', '-', ''), 24))
var mysqlName = toLower(take('${namePrefix}-${uniqueSuffix}', 63))
var environmentName = '${namePrefix}-env'

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${namePrefix}-logs'
  location: location
  properties: {
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

#disable-next-line BCP334 // namePrefix(3자 이상)와 uniqueString을 결합하므로 실제 이름은 최소 길이를 충족한다.
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  #disable-next-line BCP334
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
    publicNetworkAccess: 'Enabled'
  }
}

#disable-next-line BCP334 // namePrefix(3자 이상)와 uniqueString을 결합하므로 실제 이름은 최소 길이를 충족한다.
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  #disable-next-line BCP334
  name: storageName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
  }
}

resource fileService 'Microsoft.Storage/storageAccounts/fileServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource mediaShare 'Microsoft.Storage/storageAccounts/fileServices/shares@2023-05-01' = {
  parent: fileService
  name: 'media'
  properties: {
    accessTier: 'TransactionOptimized'
    shareQuota: 5
  }
}

resource mysql 'Microsoft.DBforMySQL/flexibleServers@2023-12-30' = {
  name: mysqlName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: mysqlAdminUser
    administratorLoginPassword: mysqlAdminPassword
    version: '8.0.21'
    storage: {
      storageSizeGB: 20
      autoGrow: 'Disabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    network: {
      publicNetworkAccess: 'Enabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource allowAzure 'Microsoft.DBforMySQL/flexibleServers/firewallRules@2023-12-30' = {
  parent: mysql
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
  }
}

resource mediaStorage 'Microsoft.App/managedEnvironments/storages@2024-03-01' = {
  parent: environment
  name: 'media'
  properties: {
    azureFile: {
      accountName: storage.name
      accountKey: storage.listKeys().keys[0].value
      shareName: mediaShare.name
      accessMode: 'ReadWrite'
    }
  }
}

output acrName string = acr.name
output acrLoginServer string = acr.properties.loginServer
output environmentName string = environment.name
output mysqlHost string = mysql.properties.fullyQualifiedDomainName
output mysqlAdminUser string = mysqlAdminUser
