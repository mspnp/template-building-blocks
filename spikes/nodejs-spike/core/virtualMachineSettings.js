'use strict';

let _ = require('lodash');
let storageSettings = require('./storageSettings.js');
let nicSettings = require('./networkInterfaceSettings.js');
let avSetSettings = require('./availabilitySetSettings.js');
let lbSettings = require('./loadBalancerSettings.js');
let resources = require('./resources.js');
let v = require('./validation.js');
let vmDefaults = require('./virtualMachineSettingsDefaults.js');
const os = require('os');

function merge({ settings, buildingBlockSettings, defaultSettings }) {
    if (v.utilities.isNullOrWhitespace(settings.osType)) {
        settings.osType = 'linux';
    } else if (!isValidOSType(_.toLower(settings.osType))) {
        throw new Error(JSON.stringify({
            name: '.osType',
            message: `Invalid value: ${settings.osType}. Valid values for 'osType' are: ${validOSTypes.join(', ')}`
        }));
    }

    // Get the defaults for the OSType selected
    let defaults = ((_.toLower(settings.osType) === 'windows') ? vmDefaults.defaultWindowsSettings : vmDefaults.defaultLinuxSettings);

    defaults = (defaultSettings) ? [defaults, defaultSettings] : defaults;

    // if load balancer is required, loadBalancerSettings property needs to be specified in parameter
    // If parameter doesnt have a loadBalancerSettings property, then remove it from defaults as well
    if (_.isNil(settings.loadBalancerSettings)) {
        delete defaults.loadBalancerSettings;
    }

    let merged = v.merge(settings, defaults, (objValue, srcValue, key) => {
        if (key === 'storageAccounts' || key === 'diagnosticStorageAccounts') {
            let mergedDefaults = storageSettings.merge(objValue, key);
            return v.merge(srcValue, mergedDefaults);
        }
        if (key === 'availabilitySet') {
            return avSetSettings.merge(srcValue, objValue);
        }
        if (key === 'nics') {
            // If source has more than 1 nic specified then set the 'isPrimary' property in defaults to false
            if (srcValue.length > 1) {
                objValue[0].isPrimary = false;
            }
            return nicSettings.merge(srcValue, buildingBlockSettings, objValue);
        }
        if (key === 'loadBalancerSettings') {
            return lbSettings.merge({ settings: srcValue, defaultSettings: objValue });
        }
    });

    // Add resourceGroupName and SubscriptionId to resources
    let updatedSettings = resources.setupResources(merged, buildingBlockSettings, (parentKey) => {
        return ((parentKey === null) || (v.utilities.isStringInArray(parentKey,
            ['virtualNetwork', 'availabilitySet', 'nics', 'diagnosticStorageAccounts', 'storageAccounts', 'loadBalancerSettings', 'encryptionSettings'])));
    });

    let normalized = NormalizeProperties(updatedSettings);
    return normalized;
}

function NormalizeProperties(settings) {
    let updatedSettings = _.cloneDeep(settings);

    // computerNamePrefix
    // if computerNamePrefix is not specified, use namePrefix
    if (v.utilities.isNullOrWhitespace(updatedSettings.computerNamePrefix) && !v.utilities.isNullOrWhitespace(updatedSettings.namePrefix)) {
        updatedSettings.computerNamePrefix = updatedSettings.namePrefix;
    }

    // loadBalancerSettings
    if (!_.isNil(updatedSettings.loadBalancerSettings)) {
        // if loadBalancerSettings is specified, add vmCount and virtualNetwork info from vm settings to the LB settings
        updatedSettings.loadBalancerSettings.vmCount = updatedSettings.vmCount;
        updatedSettings.loadBalancerSettings.virtualNetwork = updatedSettings.virtualNetwork;

        // if name is not specified in loadBalancerSettings, use namePrefix from VMSettings to build LB name
        if (v.utilities.isNullOrWhitespace(updatedSettings.loadBalancerSettings.name) && !v.utilities.isNullOrWhitespace(updatedSettings.namePrefix)) {
            updatedSettings.loadBalancerSettings.name = `${updatedSettings.namePrefix}-lb`;
        }
    }

    // availabilitySet
    // if vmCount is greater than 1 and availabilitySet is not specified, we need to create one
    if (_.isFinite(updatedSettings.vmCount) && updatedSettings.vmCount > 1) {
        if (_.isNil(updatedSettings.availabilitySet.name)) {
            updatedSettings.availabilitySet.name = `${updatedSettings.namePrefix}-as`;
        }
    }

    // osType
    updatedSettings.osType = _.toLower(updatedSettings.osType);

    // cretaeOption
    if (!_.isNil(updatedSettings.osDisk) && !v.utilities.isNullOrWhitespace(updatedSettings.osDisk.createOption)) {
        if (_.toLower(updatedSettings.osDisk.createOption) === 'fromimage') {
            updatedSettings.osDisk.createOption = 'fromImage';
        } else {
            updatedSettings.osDisk.createOption = _.toLower(updatedSettings.osDisk.createOption);
        }
    }

    if (!_.isNil(updatedSettings.dataDisks) && !_.isNil(updatedSettings.dataDisks.properties)
        && !v.utilities.isNullOrWhitespace(updatedSettings.dataDisks.properties.createOption)) {
        if (_.toLower(updatedSettings.dataDisks.properties.createOption) === 'fromimage') {
            updatedSettings.dataDisks.properties.createOption = 'fromImage';
        } else {
            updatedSettings.dataDisks.properties.createOption = _.toLower(updatedSettings.dataDisks.properties.createOption);
        }
    }

    return updatedSettings;
}

let validOSTypes = ['linux', 'windows'];
let validCachingType = ['None', 'ReadOnly', 'ReadWrite'];
let validCreateOptions = ['fromImage', 'empty', 'attach'];

let isValidOSType = (osType) => {
    return v.utilities.isStringInArray(osType, validOSTypes);
};

let isValidCachingType = (caching) => {
    return v.utilities.isStringInArray(caching, validCachingType);
};

let isValidCreateOptions = (option) => {
    return v.utilities.isStringInArray(option, validCreateOptions);
};

function validate(settings) {
    return v.validate({
        settings: settings,
        validations: virtualMachineValidations
    });
}

let encryptionSettingsValidations = {
    enabled: _.isBoolean,
    diskEncryptionKey: {
        secretUrl: v.validationUtilities.isNotNullOrWhitespace,
        sourceVaultName: v.validationUtilities.isNotNullOrWhitespace
    },
    keyEncryptionKey: {
        keyUrl: v.validationUtilities.isNotNullOrWhitespace,
        sourceVaultName: v.validationUtilities.isNotNullOrWhitespace
    }
};

let virtualMachineValidations = {
    virtualNetwork: () => {
        let virtualNetworkValidations = {
            name: v.validationUtilities.isNotNullOrWhitespace
        };

        return {
            validations: virtualNetworkValidations
        };
    },
    vmCount: (value) => {
        return {
            result: _.isFinite(value) && (value > 0),
            message: 'Value must be greater than 0'
        };
    },
    namePrefix: v.validationUtilities.isNotNullOrWhitespace,
    computerNamePrefix: (value) => {
        return {
            result: (!v.utilities.isNullOrWhitespace(value)) && (value.length < 8),
            message: 'Value cannot be longer than 7 characters'
        };
    },
    size: v.validationUtilities.isNotNullOrWhitespace,
    osType: (value) => {
        return {
            result: isValidOSType(value),
            message: `Valid values are ${validOSTypes.join(', ')}`
        };
    },
    osDisk: (value, parent) => {
        // We will need this, so we'll capture here.
        let isManagedStorageAccounts = parent.storageAccounts.managed;
        let osDiskValidations = {
            caching: (value) => {
                return {
                    result: isValidCachingType(value),
                    message: `Valid values are ${validCachingType.join(', ')}`
                };
            },
            createOption: (value) => {
                if (!isValidCreateOptions(value)) {
                    return {
                        result: false,
                        message: `Valid values are ${validCreateOptions.join(', ')}`
                    };
                }

                if (isManagedStorageAccounts && value === 'attach') {
                    return {
                        result: false,
                        message: 'Value cannot be attach with managed disks'
                    };
                }
                return { result: true };
            },
            image: (value, parent) => {
                if (parent.createOption === 'attach' && v.utilities.isNullOrWhitespace(value)) {
                    return {
                        result: false,
                        message: 'Value of image cannot be null or empty, if value of .osDisk.createOption is attach'
                    };
                }

                return { result: true };
            },
            diskSizeGB: (value) => {
                return _.isNil(value) ? {
                    result: true
                } : {
                    result: ((_.isFinite(value)) && value > 0),
                    message: 'Value must be greater than 0'
                };
            },
            encryptionSettings: (value) => {
                return _.isNil(value) ? {
                    result: true
                } : {
                    validations: encryptionSettingsValidations
                };
            }
        };

        return {
            validations: osDiskValidations
        };
    },
    dataDisks: (value, parent) => {
        // We will need this, so we'll capture here.
        let isManagedStorageAccounts = parent.storageAccounts.managed;
        let dataDiskValidations = {
            properties: {
                caching: (value) => {
                    return {
                        result: isValidCachingType(value),
                        message: `Valid values are ${validCachingType.join(', ')}`
                    };
                },
                createOption: (value) => {
                    if (!isValidCreateOptions(value)) {
                        return {
                            result: false,
                            message: `Valid values are ${validCreateOptions.join(', ')}`
                        };
                    }

                    if (isManagedStorageAccounts && value === 'attach') {
                        return {
                            result: false,
                            message: 'Value cannot be attach with managed disks'
                        };
                    }
                    return { result: true };
                },
                image: (value, parent) => {
                    if (parent.createOption === 'attach' && v.utilities.isNullOrWhitespace(value)) {
                        return {
                            result: false,
                            message: 'Value of image cannot be null or empty, if value of .dataDisks.createOption is attach'
                        };
                    }

                    return { result: true };
                },
                diskSizeGB: (value) => {
                    return {
                        result: ((_.isFinite(value)) && value > 0),
                        message: 'Value must be greater than 0'
                    };
                }
            },
            count: (value) => {
                return {
                    result: ((_.isFinite(value))),
                    message: 'Invalid value for count'
                };
            }
        };

        return {
            validations: dataDiskValidations
        };
    },
    existingWindowsServerlicense: (value, parent) => {
        if (_.isNil(value)) {
            return { result: true };
        }
        if (!_.isBoolean(value)) {
            return {
                result: false,
                message: 'Value must be Boolean'
            };
        }

        if (parent.osType !== 'windows' && value) {
            return {
                result: false,
                message: 'Value cannot be true, if the osType is windows'
            };
        }
        return { result: true };
    },
    adminUsername: v.validationUtilities.isNotNullOrWhitespace,
    adminPassword: (value, parent) => {
        let result = {
            result: true
        };
        if ((parent.osType === 'windows') && (v.utilities.isNullOrWhitespace(value))) {
            result = {
                result: false,
                message: 'adminPassword cannot be null, empty, or only whitespace if osType is windows'
            };
        }

        return result;
    },
    sshPublicKey: (value, parent) => {
        let result = {
            result: true
        };
        if ((parent.osType === 'windows') && (!_.isNil(value))) {
            result = {
                result: false,
                message: 'sshPublicKey cannot be specified if osType is windows'
            };
        } else if ((parent.osType === 'linux') && v.utilities.isNullOrWhitespace(parent.adminPassword) && v.utilities.isNullOrWhitespace(value)) {
            result = {
                result: false,
                message: 'Both adminPassword and sshPublicKey cannot be null, empty, or only whitespace if osType is linux'
            };
        } else if ((parent.osType === 'linux') && !v.utilities.isNullOrWhitespace(value) && !v.utilities.isNullOrWhitespace(parent.adminPassword)) {
            result = {
                result: false,
                message: 'sshPublicKey cannot be provided if adminPassword is provided'
            };
        }
        return result;
    },
    storageAccounts: storageSettings.storageValidations,
    diagnosticStorageAccounts: storageSettings.diagnosticValidations,
    nics: (value, parent) => {
        let result = {
            validations: nicSettings.validations
        };

        if ((!_.isNil(value)) && (value.length > 0)) {
            if ((_.filter(value, (o) => { return (_.isBoolean(o.isPrimary) && o.isPrimary); })).length !== 1) {
                return {
                    result: false,
                    message: 'Virtual machine must have only 1 primary NetworkInterface.'
                };
            } else if (!_.isNil(parent.loadBalancerSettings)) {
                let errorMsg = '';
                value.forEach((nic, index) => {
                    nic.backendPoolsNames.forEach((bep) => {
                        if (!(_.map(parent.loadBalancerSettings.backendPools, (o) => { return o.name; })).includes(bep)) {
                            errorMsg += `BackendPool ${bep} specified in nic[${index}] is not valid.${os.EOL}`;
                        }
                    });
                    nic.inboundNatRulesNames.forEach((nat) => {
                        if (!(_.map(parent.loadBalancerSettings.inboundNatRules, (o) => { return o.name; })).includes(nat)) {
                            errorMsg += `InboundNatRule ${nat} specified in nic[${index}] is not valid.${os.EOL}`;
                        }
                    });
                });
                if (!v.utilities.isNullOrWhitespace(errorMsg)) {
                    return {
                        result: false,
                        message: errorMsg
                    };
                }

            }
        } else {
            return {
                result: false,
                message: 'Virtual machine must have 1 primary NetworkInterface.'
            };
        }
        return result;
    },
    availabilitySet: (value) => {
        if (v.utilities.isNullOrWhitespace(value.name)) {
            return { result: true };
        }
        return {
            validations: avSetSettings.validations
        };
    },
    tags: v.tagsValidations,
    loadBalancerSettings: (value) => {
        if (_.isNil(value)) {
            return { result: true };
        }
        return {
            validations: lbSettings.validations
        };
    }

};

let processorProperties = {
    existingWindowsServerlicense: (value, key, index, parent) => {
        if (parent.osType === 'windows' && value) {
            return {
                licenseType: 'Windows_Server'
            };
        } else {
            return;
        }
    },
    availabilitySet: (value) => {
        if (v.utilities.isNullOrWhitespace(value.name)) {
            return {
                availabilitySet: null
            };
        }

        return {
            availabilitySet: {
                id: resources.resourceId(value.subscriptionId, value.resourceGroupName, 'Microsoft.Network/availabilitySets', value.name)
            }
        };
    },
    size: (value) => {
        return {
            hardwareProfile: {
                vmSize: value
            }
        };
    },
    imageReference: (value) => {
        return {
            storageProfile: {
                imageReference: value
            }
        };
    },
    osDisk: (value, key, index, parent, parentAccumulator, buildingBlockSettings) => {
        let instance = {
            name: parent.name.concat('-os.vhd'),
            createOption: value.createOption,
            caching: value.caching,
            osType: parent.osType
        };

        if (value.hasOwnProperty('diskSizeGB')) {
            instance.diskSizeGB = value.diskSizeGB;
        }

        if (value.encryptionSettings) {
            instance.encryptionSettings = {
                diskEncryptionKey: {
                    secretUrl: value.encryptionSettings.diskEncryptionKey.secretUrl,
                    sourceVault: {
                        id: resources.resourceId(value.encryptionSettings.subscriptionId, value.encryptionSettings.resourceGroupName, 'Microsoft.KeyVault/vaults', value.encryptionSettings.diskEncryptionKey.sourceVaultName)
                    }
                },
                keyEncryptionKey: {
                    keyUrl: value.encryptionSettings.keyEncryptionKey.keyUrl,
                    sourceVault: {
                        id: resources.resourceId(value.encryptionSettings.subscriptionId, value.encryptionSettings.resourceGroupName, 'Microsoft.KeyVault/vaults', value.encryptionSettings.keyEncryptionKey.sourceVaultName)
                    }
                },
                enabled: true
            };
        }

        if (value.createOption === 'attach') {
            instance.image = {
                uri: value.image
            };
        } else if (parent.storageAccounts.managed) {
            instance.managedDisk = {
                storageAccountType: parent.storageAccounts.skuType
            };
        } else {
            let storageAccounts = _.cloneDeep(parent.storageAccounts.accounts);
            parentAccumulator.storageAccounts.forEach((account) => {
                storageAccounts.push(account.name);
            });
            let storageAccountToUse = index % storageAccounts.length;
            instance.vhd = {
                uri: `http://${storageAccounts[storageAccountToUse]}.blob.${buildingBlockSettings.cloud.suffixes.storageEndpoint}/vhds/${parent.name}-os.vhd`
            };
        }

        return {
            storageProfile: {
                osDisk: instance
            }
        };
    },
    dataDisks: (value, key, index, parent, parentAccumulator, buildingBlockSettings) => {
        let disks = [];
        for (let i = 0; i < value.count; i++) {
            let instance = {
                name: 'dataDisk'.concat(i + 1),
                diskSizeGB: value.properties.diskSizeGB,
                lun: i,
                caching: value.properties.caching,
                createOption: value.properties.createOption
            };
            if (value.properties.createOption === 'attach') {
                instance.image = {
                    uri: value.properties.image
                };
            } else if (parent.storageAccounts.managed) {
                instance.managedDisk = {
                    storageAccountType: parent.storageAccounts.skuType
                };
            } else {
                let storageAccounts = _.cloneDeep(parent.storageAccounts.accounts);
                parentAccumulator.storageAccounts.forEach((account) => {
                    storageAccounts.push(account.name);
                });
                let storageAccountToUse = index % storageAccounts.length;
                instance.vhd = {
                    uri: `http://${storageAccounts[storageAccountToUse]}.blob.${buildingBlockSettings.cloud.suffixes.storageEndpoint}/vhds/${parent.name}-dataDisk${i + 1}.vhd`
                };
            }

            disks.push(instance);
        }
        return {
            storageProfile: {
                dataDisks: disks
            }
        };
    },
    nics: (value, key, index, parent, parentAccumulator) => {
        let ntwkInterfaces = _.transform(parentAccumulator.networkInterfaces, (result, n) => {
            if (_.includes(n.name, parent.name)) {
                let nicRef = {
                    id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/networkInterfaces', n.name),
                    properties: {
                        primary: n.properties.primary
                    }
                };
                result.push(nicRef);
            }
            return result;
        }, []);
        return {
            networkProfile: {
                networkInterfaces: ntwkInterfaces
            }
        };
    },
    diagnosticStorageAccounts: (value, key, index, parent, parentAccumulator, buildingBlockSettings) => {
        // get the diagonstic account name for the VM
        let diagnosticAccounts = _.cloneDeep(parent.diagnosticStorageAccounts.accounts);
        parentAccumulator.diagnosticStorageAccounts.forEach((account) => {
            diagnosticAccounts.push(account.name);
        });
        let diagnosticAccountToUse = index % diagnosticAccounts.length;
        let diagnosticAccountName = diagnosticAccounts[diagnosticAccountToUse];

        return {
            diagnosticsProfile: {
                bootDiagnostics: {
                    enabled: true,
                    storageUri: `http://${diagnosticAccountName}.blob.${buildingBlockSettings.cloud.suffixes.storageEndpoint}`
                }
            }
        };
    },
    computerNamePrefix: (value, key, index) => {
        return {
            osProfile: {
                computerName: value.concat('-vm', index + 1)
            }
        };
    },
    adminPassword: (value, key, index, parent) => {
        if (parent.osType === 'windows') {
            return {
                osProfile: {
                    adminPassword: '$SECRET$',
                    windowsConfiguration: {
                        provisionVmAgent: true
                    }
                }
            };
        } else {
            return {
                osProfile: {
                    adminPassword: '$SECRET$',
                    linuxConfiguration: null
                }
            };
        }
    },
    sshPublicKey: (value, key, index, parent) => {
        return {
            osProfile: {
                adminPassword: null,
                linuxConfiguration: {
                    disablePasswordAuthentication: true,
                    ssh: {
                        publicKeys: [
                            {
                                path: `/home/${parent.adminUsername}/.ssh/authorized_keys`,
                                keyData: '$SECRET$'
                            }
                        ]
                    }
                }
            }
        };
    },
    adminUsername: (value) => {
        return {
            osProfile: {
                adminUsername: value
            }
        };
    }
};

function processVMStamps(param) {
    // deep clone settings for the number of VMs required (vmCount) 
    let vmCount = param.vmCount;
    let result = [];
    for (let i = 0; i < vmCount; i++) {
        let stamp = _.cloneDeep(param);
        stamp.name = param.namePrefix.concat('-vm', i + 1);

        // delete namePrefix property since we wont need it anymore
        delete stamp.namePrefix;
        result.push(stamp);
    }
    return result;
}

function transform(settings, buildingBlockSettings) {
    let accumulator = { publicIpAddresses: [], networkInterfaces: [] };

    // process storageAccounts
    accumulator.storageAccounts = (storageSettings.transform(settings.storageAccounts, settings)).accounts;

    // process diagnosticStorageAccounts
    accumulator.diagnosticStorageAccounts = (storageSettings.transform(settings.diagnosticStorageAccounts, settings)).accounts;

    // process availabilitySet
    if (!v.utilities.isNullOrWhitespace(settings.availabilitySet.name)) {
        _.merge(accumulator, avSetSettings.transform(settings.availabilitySet, settings));
    } else {
        accumulator.availabilitySet = [];
    }

    // process secrets
    if (settings.osType === 'linux' && !_.isNil(settings.sshPublicKey)) {
        accumulator.secret = settings.sshPublicKey;
    } else {
        accumulator.secret = settings.adminPassword;
    }

    // process load balancer if specified
    if (settings.loadBalancerSettings) {
        let lbResults = lbSettings.transform(settings.loadBalancerSettings, buildingBlockSettings);
        accumulator.loadBalancer = lbResults.loadBalancer;
        if (lbResults.publicIpAddresses) {
            accumulator.publicIpAddresses = _.concat(accumulator.publicIpAddresses, lbResults.publicIpAddresses);
        }
    }

    let vms = _.transform(processVMStamps(settings), (result, vmStamp, vmIndex) => {
        // process network interfaces
        let nicResults = nicSettings.transform(vmStamp.nics, vmStamp, vmIndex);
        accumulator.networkInterfaces = _.concat(accumulator.networkInterfaces, nicResults.nics);
        accumulator.publicIpAddresses = _.concat(accumulator.publicIpAddresses, nicResults.pips);

        // process virtual machine properties
        let vmProperties = _.transform(vmStamp, (properties, value, key, parent) => {
            if (processorProperties[key]) {
                _.merge(properties, processorProperties[key](value, key, vmIndex, parent, accumulator, buildingBlockSettings));
            }
            return properties;
        }, {});

        result.virtualMachines.push({
            properties: vmProperties,
            name: vmStamp.name,
            resourceGroupName: vmStamp.resourceGroupName,
            subscriptionId: vmStamp.subscriptionId,
            location: vmStamp.location,
            tags: vmStamp.tags
        });

        return result;
    }, { virtualMachines: [] });

    // TODO: Add nic updates

    return _.merge(accumulator, vms);
}

function process({ settings, buildingBlockSettings, defaultSettings }) {
    // Merge
    let mergedSettings = merge({
        settings: settings,
        buildingBlockSettings: buildingBlockSettings,
        defaultSettings: defaultSettings
    });

    // Validate
    let errors = validate(mergedSettings);

    if (errors.length > 0) {
        throw new Error(JSON.stringify(errors));
    }

    // Transform
    let results = transform(mergedSettings, buildingBlockSettings);
    let resourceGroups = resources.extractResourceGroups(
        results.availabilitySet,
        results.diagnosticStorageAccounts,
        results.loadBalancer,
        results.networkInterfaces,
        results.publicIpAddresses,
        results.storageAccounts,
        results.virtualMachines);

    return {
        resourceGroups: resourceGroups,
        parameters: results
    };
}

exports.process = process;