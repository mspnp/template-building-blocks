'use strict';

const VIRTUALMACHINE_SETTINGS_DEFAULTS_WINDOWS = {
    vmCount: 1,
    namePrefix: 'test',
    computerNamePrefix: 'test',
    size: 'Standard_DS2_v2',
    osDisk: {
        osType: 'windows',
        caching: 'ReadWrite',
        createOption: 'fromImage'
    },
    adminUsername: 'adminUser',
    osAuthenticationType: 'password',
    storageAccounts: {},
    diagnosticStorageAccounts: {},
    nics: [{}],
    imageReference: {
        publisher: 'MicrosoftWindowsServer',
        offer: 'WindowsServer',
        sku: '2012-R2-Datacenter',
        version: 'latest'
    },
    dataDisks: {
        count: 0,
        properties: {
            diskSizeGB: 127,
            caching: 'None',
            createOption: 'empty'
        }
    },
    existingWindowsServerlicense: false,
    availabilitySet: {},
    virtualNetwork: {},
    loadBalancerSettings: {},
    tags: {}
};

const VIRTUALMACHINE_SETTINGS_DEFAULTS_LINUX = {
    vmCount: 1,
    namePrefix: 'test',
    computerNamePrefix: 'test',
    size: 'Standard_DS2_v2',
    osDisk: {
        osType: 'linux',
        caching: 'ReadWrite',
        createOption: 'fromImage'
    },
    adminUsername: 'adminUser',
    osAuthenticationType: 'password',
    storageAccounts: {},
    diagnosticStorageAccounts: {},
    nics: [{}],
    imageReference: {
        publisher: 'Canonical',
        offer: 'UbuntuServer',
        sku: '14.04.5-LTS',
        version: 'latest'
    },
    dataDisks: {
        count: 0,
        properties: {
            diskSizeGB: 127,
            caching: 'None',
            createOption: 'empty'
        }
    },
    availabilitySet: {},
    virtualNetwork: {},
    loadBalancerSettings: {},
    tags: {}
};

exports.defaultWindowsSettings = VIRTUALMACHINE_SETTINGS_DEFAULTS_WINDOWS;
exports.defaultLinuxSettings = VIRTUALMACHINE_SETTINGS_DEFAULTS_LINUX;