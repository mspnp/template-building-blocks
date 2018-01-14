'use strict';

let _ = require('lodash');
let storageSettings = require('./storageSettings');
let nicSettings = require('./networkInterfaceSettings');
let avSetSettings = require('./availabilitySetSettings');
let lbSettings = require('./loadBalancerSettings');
let gatewaySettings = require('./applicationGatewaySettings');
let resources = require('./resources');
let v = require('./validation');
let vmDefaults = require('./virtualMachineSettingsDefaults');
let vmExtensions = require('./virtualMachineExtensionsSettings');
let scaleSetSettings = require('./virtualMachineScaleSetSettings');
const os = require('os');

const AUTHENTICATION_PLACEHOLDER = '$AUTHENTICATION$';

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
    let defaults = _.cloneDeep((_.toLower(settings.osType) === 'windows') ? vmDefaults.defaultWindowsSettings : vmDefaults.defaultLinuxSettings);

    // if disk encryption is required, osDisk.encryptionSettings property needs to be specified in parameter
    if (_.isNil(settings.osDisk) || _.isNil(settings.osDisk.encryptionSettings)) {
        // If parameter doesnt have an osDisk.encryptionSettings property, then remove it from defaults as well
        delete defaults.osDisk.encryptionSettings;
    }

    // if load balancer is required, loadBalancerSettings property needs to be specified in parameter
    if (_.isNil(settings.loadBalancerSettings)) {
        // If parameter doesnt have a loadBalancerSettings property, then remove it from defaults as well
        delete defaults.loadBalancerSettings;
    } else if (v.utilities.isNullOrWhitespace(settings.loadBalancerSettings.name) &&
        (_.isNil(defaultSettings) || _.isNil(defaultSettings.loadBalancerSettings) || v.utilities.isNullOrWhitespace(defaultSettings.loadBalancerSettings.name))) {
        settings.loadBalancerSettings.name = `${settings.namePrefix}-lb`;
    }

    // if app gateway is required, applicationGatewaySettings property needs to be specified in parameter
    if (_.isNil(settings.applicationGatewaySettings)) {
        // If parameter doesnt have a applicationGatewaySettings property, then remove it from defaults as well
        delete defaults.applicationGatewaySettings;
    } else if (v.utilities.isNullOrWhitespace(settings.applicationGatewaySettings.name) &&
        (_.isNil(defaultSettings) || _.isNil(defaultSettings.applicationGatewaySettings) || v.utilities.isNullOrWhitespace(defaultSettings.applicationGatewaySettings.name))) {
        settings.applicationGatewaySettings.name = `${settings.namePrefix}-gw`;
    }

    // if scaleset is required, scaleSetSettings property needs to be specified in parameter
    if (_.isNil(settings.scaleSetSettings)) {
        // If parameter doesnt have a scaleSetSettings property, then remove it from defaults as well
        delete defaults.scaleSetSettings;
    } else if (v.utilities.isNullOrWhitespace(settings.scaleSetSettings.name) &&
        (_.isNil(defaultSettings) || _.isNil(defaultSettings.scaleSetSettings) || v.utilities.isNullOrWhitespace(defaultSettings.scaleSetSettings.name))) {
        settings.scaleSetSettings.name = `${settings.namePrefix}-ss`;
    }

    defaults = (defaultSettings) ? [defaults, defaultSettings] : defaults;

    let merged = v.merge(settings, defaults, (objValue, srcValue, key) => {
        if (key === 'storageAccounts') {
            return storageSettings.storageMerge({
                settings: srcValue,
                buildingBlockSettings: buildingBlockSettings,
                defaultSettings: objValue
            });
        }
        if (key === 'diagnosticStorageAccounts') {
            return storageSettings.diagnosticMerge({
                settings: srcValue,
                buildingBlockSettings: buildingBlockSettings,
                defaultSettings: objValue
            });
        }
        if (key === 'availabilitySet') {
            return avSetSettings.merge({
                settings: srcValue,
                buildingBlockSettings: buildingBlockSettings,
                defaultSettings: objValue
            });
        }
        if (key === 'nics') {
            return nicSettings.merge({
                settings: srcValue,
                buildingBlockSettings: buildingBlockSettings,
                defaultSettings: objValue
            });
        }
        if (key === 'imageReference') {
            if (!_.isEmpty(srcValue)) {
                return srcValue;
            }
        }
        if (key === 'scaleSetSettings') {
            return scaleSetSettings.merge({
                settings: srcValue,
                buildingBlockSettings: buildingBlockSettings,
                defaultSettings: objValue
            });
        }
    });

    // Add resourceGroupName and SubscriptionId to resources
    let updatedSettings = resources.setupResources(merged, buildingBlockSettings, (parentKey) => {
        return ((parentKey === null) || (v.utilities.isStringInArray(parentKey,
            ['virtualNetwork', 'availabilitySet', 'nics', 'diagnosticStorageAccounts', 'storageAccounts', 'applicationGatewaySettings',
                'loadBalancerSettings', 'scaleSetSettings', 'publicIpAddress', 'keyVault', 'diskEncryptionKeyVault', 'keyEncryptionKeyVault'])));
    });

    let normalized = NormalizeProperties(updatedSettings);

    // TODO - fromImage settings
    // We need to modify defaults based on some values in settings in order to support the different createOption settings
    if (normalized.storageAccounts.managed) {
        if (normalized.osDisk.createOption === 'attach') {
            delete normalized.imageReference;
        }
    } else {
        if (((normalized.osDisk.createOption === 'fromImage') && (normalized.osDisk.images)) ||
            (normalized.osDisk.createOption === 'attach')) {
            delete normalized.imageReference;
        }
    }

    return normalized;
}

function NormalizeProperties(settings) {
    let updatedSettings = _.cloneDeep(settings);

    // computerNamePrefix
    // if computerNamePrefix is not specified, assign an empty string
    if (v.utilities.isNullOrWhitespace(updatedSettings.computerNamePrefix)) {
        updatedSettings.computerNamePrefix = '';
    }

    // loadBalancerSettings
    if (!_.isNil(updatedSettings.loadBalancerSettings)) {
        // if loadBalancerSettings is specified, add virtualNetwork info from vm settings to the LB settings
        updatedSettings.loadBalancerSettings.virtualNetwork = updatedSettings.virtualNetwork;
    }

    // applicationGatewaySettings
    if (!_.isNil(updatedSettings.applicationGatewaySettings)) {
        // if applicationGatewaySettings is specified, add virtualNetwork info from vm settings to the gateway settings
        updatedSettings.applicationGatewaySettings.virtualNetwork = updatedSettings.virtualNetwork;
    }

    if (!_.isNil(updatedSettings.scaleSetSettings)) {
        let autoScale = updatedSettings.scaleSetSettings.autoScaleSettings;

        if (v.utilities.isNullOrWhitespace(autoScale.name)) {
            autoScale.name = `${updatedSettings.scaleSetSettings.name}-auto`;
        }
        if (v.utilities.isNullOrWhitespace(autoScale.targetResourceUri)) {
            autoScale.targetResourceUri = resources.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.Compute/virtualMachineScaleSets', updatedSettings.scaleSetSettings.name);
        }

        autoScale.profiles.forEach((p) => {
            if (_.isNil(p.capacity) || _.isEmpty(p.capacity)) {
                p.capacity = {
                    minimum: _.ceil(updatedSettings.vmCount / 2),
                    maximum: updatedSettings.vmCount * 2,
                    default: updatedSettings.vmCount
                };
            }
            p.rules.forEach((r) => {
                if (v.utilities.isNullOrWhitespace(r.metricTrigger.metricResourceUri)) {
                    r.metricTrigger.metricResourceUri = resources.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.Compute/virtualMachineScaleSets', updatedSettings.scaleSetSettings.name);
                }
            });
        });
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

    // createOption
    if (!_.isNil(updatedSettings.osDisk) && !v.utilities.isNullOrWhitespace(updatedSettings.osDisk.createOption)) {
        if (_.toLower(updatedSettings.osDisk.createOption) === 'fromimage') {
            updatedSettings.osDisk.createOption = 'fromImage';
        } else {
            updatedSettings.osDisk.createOption = _.toLower(updatedSettings.osDisk.createOption);
        }
    }

    if (!_.isNil(updatedSettings.dataDisks) && !_.isNil(updatedSettings.dataDisks)
        && !v.utilities.isNullOrWhitespace(updatedSettings.dataDisks.createOption)) {
        if (_.toLower(updatedSettings.dataDisks.createOption) === 'fromimage') {
            updatedSettings.dataDisks.createOption = 'fromImage';
        } else {
            updatedSettings.dataDisks.createOption = _.toLower(updatedSettings.dataDisks.createOption);
        }
    }

    return updatedSettings;
}

let validOSTypes = ['linux', 'windows'];
let validCachingType = ['None', 'ReadOnly', 'ReadWrite'];
let validOsDiskCreateOptions = ['fromImage', 'attach'];
let validDataDiskCreateOptions = ['fromImage', 'empty', 'attach'];
let validEncryptionVolumeType = ['OS', 'Data', 'All'];

let isValidOSType = (osType) => {
    return v.utilities.isStringInArray(osType, validOSTypes);
};

let isValidCachingType = (caching) => {
    return v.utilities.isStringInArray(caching, validCachingType);
};

let isValidOsDiskCreateOptions = (option) => {
    return v.utilities.isStringInArray(option, validOsDiskCreateOptions);
};

let isValidDataDiskCreateOptions = (option) => {
    return v.utilities.isStringInArray(option, validDataDiskCreateOptions);
};

let isValidEncryptionVolumeType = (option) => {
    return v.utilities.isStringInArray(option, validEncryptionVolumeType);
};

function validate(settings) {
    return v.validate({
        settings: settings,
        validations: virtualMachineValidations
    });
}

let loadBalancerSettingsValidations = {
    inboundNatRules: (value) => {
        if (value.length === 0) {
            return {
                result: true
            };
        }

        return {
            validations: {
                name: v.validationUtilities.isNotNullOrWhitespace,
                startingFrontendPort: (value) => {
                    return {
                        result: _.inRange(_.toSafeInteger(value), 1, 65535),
                        message: 'Valid values are from 1 to 65534'
                    };
                }
            }
        };
    }
};

let virtualMachineValidations = {
    virtualNetwork: (value, parent) => {
        if (_.isNil(parent.scaleSetSettings) && value.location !== parent.location) {
            return {
                result: false,
                message: 'Virtual Machine must be the same location than Virtual Network'
            };
        }
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
    computerNamePrefix: (value, parent) => {
        if (!_.isNil(parent.scaleSetSettings)) {
            if (v.utilities.isNullOrWhitespace(value)) {
                if (v.utilities.isNullOrWhitespace(parent.namePrefix)) {
                    return {
                        result: false,
                        message: 'If computerNamePrefix is not specified, then .namePrefix must be provided'
                    };
                } else if ((parent.namePrefix.length + '000000'.length) > 15) {
                    return {
                        result: false,
                        message: `Computer name length cannot be greater than 15. If computerNamePrefix value is not specified, then computer name is computed using namePrefix: ${parent.namePrefix}000000`
                    };
                }
            } else {
                if ((value.length + '000000'.length) > 15) {
                    return {
                        result: false,
                        message: `Computer name length cannot be greater than 15. Computer name is computed using computerNamePrefix: ${value}000000`
                    };
                }
            }
        } else {
            if (v.utilities.isNullOrWhitespace(value)) {
                if (v.utilities.isNullOrWhitespace(parent.namePrefix)) {
                    return {
                        result: false,
                        message: 'If computerNamePrefix is not specified, then .namePrefix must be provided'
                    };
                } else if ((parent.namePrefix.length + '-vm'.length + _.toString(parent.vmCount).length) > 15) {
                    return {
                        result: false,
                        message: `Computer name length cannot be greater than 15. If computerNamePrefix value is not specified, then computer name is computed using namePrefix: ${parent.namePrefix}-vm${parent.vmCount}`
                    };
                }
            } else {
                if ((value.length + _.toString(parent.vmCount).length) > 15) {
                    return {
                        result: false,
                        message: `Computer name length cannot be greater than 15. Computer name is computed using computerNamePrefix: ${value}${parent.vmCount}`
                    };
                }
            }
        }
        return {
            result: true
        };
    },
    size: v.validationUtilities.isNotNullOrWhitespace,
    osType: (value) => {
        return {
            result: isValidOSType(value),
            message: `Valid values are ${validOSTypes.join(', ')}`
        };
    },
    customData: (value) => {
        if (_.isUndefined(value)) {
            return {
                result: true
            };
        }

        return {
            validations: v.validationUtilities.isNotNullOrWhitespace
        };
    },
    imageReference: (value, parent) => {
        if (_.isNil(value)) {
            // We will allow null or undefined, since any issues should be caught in os and data disks.
            return {
                result: true
            };
        }
        if (parent.storageAccounts.managed) {
            // With managed disks this has to be the four fields OR just id.  The specific createOption values will be handled by the os and data disk validations
            if (value.id) {
                return {
                    validations: {
                        id: v.validationUtilities.isNotNullOrWhitespace,
                        publisher: (value) => {
                            return {
                                result: v.utilities.isNullOrWhitespace(value),
                                message: 'publisher cannot be specified if id is present'
                            };
                        },
                        offer: (value) => {
                            return {
                                result: v.utilities.isNullOrWhitespace(value),
                                message: 'offer cannot be specified if id is present'
                            };
                        },
                        sku: (value) => {
                            return {
                                result: v.utilities.isNullOrWhitespace(value),
                                message: 'sku cannot be specified if id is present'
                            };
                        },
                        version: (value) => {
                            return {
                                result: v.utilities.isNullOrWhitespace(value),
                                message: 'version cannot be specified if id is present'
                            };
                        },
                    }
                };
            } else {
                return {
                    validations: {
                        id: (value) => {
                            return {
                                result: _.isUndefined(value),
                                message: 'id cannot be specified if publisher, offer, sku, and version are present'
                            };
                        },
                        publisher: v.validationUtilities.isNotNullOrWhitespace,
                        offer: v.validationUtilities.isNotNullOrWhitespace,
                        sku: v.validationUtilities.isNotNullOrWhitespace,
                        version: v.validationUtilities.isNotNullOrWhitespace
                    }
                };
            }
        } else {
            return {
                validations: {
                    id: (value) => {
                        return {
                            result: _.isUndefined(value),
                            message: 'id cannot be used for unmanaged disk images'
                        };
                    },
                    publisher: v.validationUtilities.isNotNullOrWhitespace,
                    offer: v.validationUtilities.isNotNullOrWhitespace,
                    sku: v.validationUtilities.isNotNullOrWhitespace,
                    version: v.validationUtilities.isNotNullOrWhitespace
                }
            };
        }
    },
    osDisk: (value, parent) => {
        // We will need this, so we'll capture here.
        let isManagedStorageAccounts = parent.storageAccounts.managed;
        let imageReference = parent.imageReference;
        let vmCount = parent.vmCount;
        let isScaleSet = !_.isNil(parent.scaleSetSettings);
        let osType = parent.osType;
        let osDiskValidations = {
            caching: (value) => {
                return {
                    result: isValidCachingType(value),
                    message: `Valid values are ${validCachingType.join(', ')}`
                };
            },
            createOption: (value) => {
                if (!isValidOsDiskCreateOptions(value)) {
                    return {
                        result: false,
                        message: `Valid values are ${validOsDiskCreateOptions.join(', ')}`
                    };
                }

                return { result: true };
            },
            images: (value, parent) => {
                // If we are using unmanaged disks, this field serves two purposes.
                // 1.  If createOption is fromImage, and imageReference is not specified, it must be a single-element array pointing to a blob
                //     with a generalized disk image
                // 2.  If createOption is attach, it must be an array with vmCount elements pointing to different non-generalized blob images
                if (parent.createOption === 'fromImage') {
                    if (isManagedStorageAccounts) {
                        if (!_.isUndefined(value)) {
                            return {
                                result: false,
                                message: '.osDisk.images cannot be specified if using managed storage accounts'
                            };
                        }
                    } else {
                        let isValidImageValue = (!_.isNil(value)) && (_.isArray(value)) && (value.length === 1);
                        if (((_.isNil(imageReference)) && (!isValidImageValue)) ||
                            ((!_.isNil(imageReference)) && (isValidImageValue))) {
                            return {
                                result: false,
                                message: 'Either .imageReference or a 1-element array .osDisk.images must be specified if value of .osDisk.createOption is fromImage, but not both'
                            };
                        }
                    }
                }
                else if (parent.createOption === 'attach') {
                    // In this case, managed and unmanaged are the same.  But imageReference cannot be specified.
                    if (!_.isNil(imageReference)) {
                        return {
                            result: false,
                            message: '.imageReference cannot be specified if .osDisk.createOption is attach'
                        };
                    } else if (!isScaleSet && ((_.isNil(value)) || (!_.isArray(value)) || (value.length !== vmCount))) {
                        // This only valid if we are not using a scale set.  The scale set validations will catch the invalid attach
                        return {
                            result: false,
                            message: 'If .osDisk.createOption is attach, .osDisk.images must be an array with a length of vmCount pointing to storage blobs (for unmanaged) or Microsoft.Compute/disks resources (for managed)'
                        };
                    }
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
            encryptionSettings: (value, parent) => {
                if (_.isNil(value)) {
                    return {
                        result: true
                    };
                }
                // This can work in one of two ways.  One is pre-encrypted disk and the second, is Azure encrypting the disks with the extension
                // We'll use diskEncryptionKey as our discriminator to decide how we are working
                if (value.diskEncryptionKey) {
                    // This is a set of pre-encrypted disks, so we need to set the settings when we create the disk.  The required information
                    // MUST already be in KeyVault.  Each of these must be an array since this only works in an attach scenario.
                    if (parent.createOption !== 'attach') {
                        return {
                            result: false,
                            message: 'Pre-encrypted disks are only supported with createOption === \'attach\''
                        };
                    }
                    return {
                        validations: {
                            diskEncryptionKey: {
                                secretUrls: (value) => {
                                    if (_.isNil(value) || !_.isArray(value) || value.length !== vmCount) {
                                        return {
                                            result: false,
                                            message: 'secretUrls must be an array with a length === vmCount pointing to a KeyVault secret for each virtual machine'
                                        };
                                    } else {
                                        return {
                                            validations: v.validationUtilities.isNotNullOrWhitespace
                                        };
                                    }
                                },
                                keyVault: v.resourceReferenceValidations
                            },
                            keyEncryptionKey: (value) => {
                                // This can be null, if we are not using a key encryption key
                                if (_.isNil(value)) {
                                    return {
                                        result: true
                                    };
                                } else {
                                    return {
                                        validations: {
                                            keyUrls: (value) => {
                                                if (_.isNil(value) || !_.isArray(value) || value.length !== vmCount || value.length !== 1) {
                                                    return {
                                                        result: false,
                                                        message: 'keyUrls must be an array with a length === vmCount or length === 1 (to use the same key) pointing to a KeyVault key to use for each diskEncryptionKey'
                                                    };
                                                } else {
                                                    return {
                                                        validations: v.validationUtilities.isNotNullOrWhitespace
                                                    };
                                                }
                                            },
                                            keyVault: v.resourceReferenceValidations
                                        }
                                    };
                                }
                            }
                        }
                    };
                } else {
                    // We are going to encrypt with the extension
                    // Let's check the cross-field values first.  Since protectedSettings may not be there or is a keyVault reference, let's be safe
                    let aadClientSecret = _.get(value, 'protectedSettings.aadClientSecret');
                    let hasKeyVaultReference = _.get(value, 'protectedSettings.reference');
                    return {
                        validations: {
                            aadClientId: v.validationUtilities.isNotNullOrWhitespace,
                            aadClientCertThumbprint: (value, parent) => {
                                // If a key vault reference exists, we can't really validate this since aadClientSecret could be in the
                                // KeyVault referenced by protectedSettings.  If the aadClientSecret is not in the KeyVault, the deployment will
                                // fail if this is not specified.
                                if (hasKeyVaultReference) {
                                    return {
                                        result: true
                                    };
                                }
                                if ((!v.utilities.isNullOrWhitespace(value)) && (!v.utilities.isNullOrWhitespace(aadClientSecret))) {
                                    return {
                                        result: false,
                                        message: 'Either aadClientCertThumbprint or aadClientSecret must be specified, but not both'
                                    };
                                } else if (!v.utilities.isNullOrWhitespace(aadClientSecret)) {
                                    return {
                                        result: true
                                    };
                                } else {
                                    return {
                                        validations: v.validationUtilities.isNotNullOrWhitespace
                                    };
                                }
                            },
                            diskEncryptionKeyVault: (value) => {
                                if (_.isNil(value)) {
                                    return {
                                        result: false,
                                        message: 'Value cannot be undefined or null'
                                    };
                                }

                                return {
                                    validations: resources.resourceReferenceValidations
                                };
                            },
                            diskEncryptionKeyVaultUrl: v.validationUtilities.isNotNullOrWhitespace,
                            keyEncryptionKeyVault: (value, parent) => {
                                if (v.utilities.isNullOrWhitespace(parent.keyEncryptionKeyUrl)) {
                                    return {
                                        result: _.isNil(value),
                                        message: 'Value cannot be specified without a keyEncryptionKeyUrl'
                                    };
                                }

                                return {
                                    validations: resources.resourceReferenceValidations
                                };
                            },
                            keyEncryptionKeyUrl: (value, parent) => {
                                if (_.isNil(parent.keyEncryptionKeyVault)) {
                                    return {
                                        result: v.utilities.isNullOrWhitespace(value),
                                        message: 'Value cannot be specified without a keyEncryptionKeyVault'
                                    };
                                } else {
                                    return {
                                        validations: v.validationUtilities.isNotNullOrWhitespace
                                    };
                                }
                            },
                            volumeType: (value) => {
                                return {
                                    result: isValidEncryptionVolumeType(value),
                                    message: `Valid values are ${validEncryptionVolumeType.join(', ')}`
                                };
                            },
                            protectedSettings: (value, parent) => {
                                // First, let's see if we are a keyvault reference
                                if (!_.isNil(value) && (value.reference)) {
                                    // KeyVault references are not supported for extension protectedSettings on VMSS
                                    if (isScaleSet) {
                                        return {
                                            result: false,
                                            message: 'protectedSettings cannot be a KeyVault reference for Virtual Machine ScaleSets'
                                        };
                                    }

                                    return v.keyVaultSecretValidations;
                                }
                                // If our osType is linux, this CANNOT be null or undefined, because passphrase must be there.
                                // If our osType is windows, this may or may not be there, based on the value of aadClientCertThumbprint
                                if ((osType === 'windows') && (!v.utilities.isNullOrWhitespace(parent.aadClientCertThumbprint)) &&
                                    (_.isNil(value))) {
                                    return {
                                        result: true
                                    };
                                }
                                return {
                                    validations: {
                                        // If aadClientCertThumbprint is invalid, we validate this.
                                        // Otherwise, that means aadClientCertThumbprint was specified and we should error if aadClientSecret is present
                                        aadClientSecret: v.utilities.isNullOrWhitespace(parent.aadClientCertThumbprint) ? v.validationUtilities.isNotNullOrWhitespace :
                                            (value) => {
                                                return {
                                                    result: _.isUndefined(value),
                                                    message: 'Either aadClientCertThumbprint or aadClientSecret must be specified, but not both'
                                                };
                                            },
                                        passphrase: osType === 'windows' ? (value) => {
                                            return {
                                                result: _.isUndefined(value),
                                                message: `Value cannot be specified for osType === '${osType}'`
                                            };
                                        } : v.validationUtilities.isNotNullOrWhitespace
                                    }
                                };
                            }
                        }
                    };
                }
            }
        };

        return {
            validations: osDiskValidations
        };
    },
    dataDisks: (value, parent) => {
        // We will need this, so we'll capture here.
        let isManagedStorageAccounts = parent.storageAccounts.managed;
        let vmCount = parent.vmCount;
        let isScaleSet = !_.isNil(parent.scaleSetSettings);
        let dataDiskValidations = {
            caching: (value) => {
                return {
                    result: isValidCachingType(value),
                    message: `Valid values are ${validCachingType.join(', ')}`
                };
            },
            createOption: (value) => {
                if (!isValidDataDiskCreateOptions(value)) {
                    return {
                        result: false,
                        message: `Valid values are ${validDataDiskCreateOptions.join(', ')}`
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
            disks: (value, parent) => {
                return {
                    validations: (value) => {
                        // attach is the same for both managed and unmanaged disks.
                        // We disallow attach for managed disks.  This will be validated by the scale set validations
                        if ((value.createOption === 'attach') && (!isScaleSet)) {
                            // Make sure the length of images is the same as vmcount
                            if ((_.isNil(value.images)) || (value.images.length !== vmCount)) {
                                return {
                                    result: false,
                                    message: `images cannot be null or undefined and must match the vmCount of ${vmCount}`
                                };
                            }

                            // Make sure that all values are arrays and that they are not null or undefined
                            if (_.some(value.images, (value) => {
                                return _.isNil(value) || !_.isArray(value) || (value.length === 0);
                            })) {
                                return {
                                    result: false,
                                    message: 'images must contain only arrays that are not null, undefined, or have a length of 0'
                                };
                            }

                            // Make sure the arrays are all the same length
                            let firstLength = value.images[0].length;
                            if (!_.every(value.images, (value) => {
                                return value.length === firstLength;
                            })) {
                                return {
                                    result: false,
                                    message: 'images must contain arrays that all have the same length'
                                };
                            }

                            // Make sure all of the arrays are all strings and are not undefined, null, or only whitespace
                            if (_.some(value.images, (value) => {
                                return _.some(value, (value) => {
                                    return v.utilities.isNullOrWhitespace(value);
                                });
                            })) {
                                return {
                                    result: false,
                                    message: 'images must contain string values that are not undefined, null, or only whitespace'
                                };
                            }
                        } else if (value.createOption === 'fromImage') {
                            if (isManagedStorageAccounts) {
                                // For fromImage and managed accounts, the images are contained within the Microsoft.Compute/images resource,
                                // so if images is specified, we should fail
                                if (!_.isUndefined(value.images)) {
                                    return {
                                        result: false,
                                        message: 'images cannot be specified with fromImage for managed disks'
                                    };
                                }
                            } else {
                                // Make sure the length of images is 1, and not null, empty, or only whitespace.
                                if (_.isNil(value.images) || !_.isArray(value.images) || (value.images.length !== 1) || v.utilities.isNullOrWhitespace(value.images[0])) {
                                    return {
                                        result: false,
                                        message: 'images must be a 1-element array pointing to a storage blob containing a disk image'
                                    };
                                }
                            }
                        }

                        return { result: true };
                    }
                };
            },
            diskSizeGB: (value) => {
                return {
                    result: ((_.isFinite(value)) && value > 0),
                    message: 'Value must be greater than 0'
                };
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
    adminUsername: (value) => {
        if (_.isNil(value) || _.isEmpty(value)) {
            return {
                result: false,
                name: '.adminUsername',
                message: 'adminUsername cannot be null or empty'
            };
        }
        if (value.length > 20 || value.substr(value.length - 1) === '.') {
            return {
                result: false,
                name: '.adminUsername',
                message: 'adminUsername cannot be more than 20 characters long o end with a period(.)'
            };
        }
        if (v.isInvalidUsername(value)) {
            return {
                result: false,
                name: '.adminUsername',
                message: 'adminUsername cannot contains these characters: " [ ] : | < > + = ; , ? * @'
            };
        }
        return { result: true };
    },
    adminPassword: (value, parent) => {
        if (value.reference) {
            delete value.reference.keyVault.subscriptionId
            delete value.reference.keyVault.resourceGroupName
            delete value.reference.keyVault.location
        }
        let result = {
            result: true
        };
        if (v.utilities.isNullOrWhitespace(value)) {
            if (parent.osType === 'windows') {
                return {
                    result: false,
                    message: 'adminPassword cannot be null, empty, or only whitespace if osType is windows'
                };
            }
            if (_.isNil(parent.sshPublicKey) || v.utilities.isNullOrWhitespace(parent.sshPublicKey)) {
                return {
                    result: false,
                    message: 'adminPassword and sshPublicKey cannot both be null or empty'
                };
            }
            return result;
        }
        if (value.length < 6 || value.length > 72) {
            return {
                result: false,
                name: '.adminPassword',
                message: 'The supplied password must be between 6-72 characters long'
            };
        }
        if (v.isInvalidPassword(value)) {
            return {
                result: false,
                name: '.adminPassword',
                message: 'The supplied password must satisfy at least 3 of password complexity requirements from the following: 1) Contains an uppercase character, 2) Contains a lowercase character, 3) Contains a numeric digit, 4) Contains a special character'
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
    storageAccounts: (value, parent) => {
        if (value.location !== parent.location || value.subscriptionId !== parent.subscriptionId) {
            return {
                result: false,
                message: 'Virtual Machine must be in the same location and subscription than storage account'
            };
        }
        let result = {
            validations: storageSettings.storageValidations
        };
        return result;
    },
    diagnosticStorageAccounts: (value, parent) => {
        if (value.location !== parent.location || value.subscriptionId !== parent.subscriptionId) {
            return {
                result: false,
                message: 'Virtual Machine must be in the same location and subscription than diagnostic storage account'
            };
        }
        let result = {
            validations: storageSettings.diagnosticValidations
        };
        return result;
    },
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
            }

            let errorMsg = '';
            value.forEach((nic, index) => {
                nic.applicationGatewayBackendPoolNames.forEach((applicationGatewayBackendPoolName) => {
                    let gwBep = _.isString(applicationGatewayBackendPoolName) ? {name: applicationGatewayBackendPoolName} : applicationGatewayBackendPoolName;
                    if (v.utilities.isNullOrWhitespace(gwBep.name)) {
                        errorMsg += `ApplicationGateway BackendPool specified in nic[${index}] must have name.${os.EOL}`;
                    } else if (v.utilities.isNullOrWhitespace(gwBep.applicationGatewayName)) {
                        if (!v.utilities.isNullOrWhitespace(gwBep.resourceGroupName) || !v.utilities.isNullOrWhitespace(gwBep.subscriptionId) || !v.utilities.isNullOrWhitespace(gwBep.location)) {
                            errorMsg += `ApplicationGatewayBackendPool ${gwBep.name} specified in nic[${index}] doesnt specify applicationGatewayName, therefore resourceGroupName, subscriptionId & location cannot be specified.${os.EOL}`;
                        }
                        if (_.isNil(parent.applicationGatewaySettings)) {
                            errorMsg += `If applicationGatewaySettings is not specified, then applicationGatewayBackendPool specified in nic[${index}] must provide both name and applicationGatewayName.${os.EOL}`;
                        }
                    }
                });
                nic.backendPoolNames.forEach((backendPoolName) => {
                    let bep = _.isString(backendPoolName) ? {name: backendPoolName} : backendPoolName;
                    if (v.utilities.isNullOrWhitespace(bep.name)) {
                        errorMsg += `BackendPool specified in nic[${index}] must have name.${os.EOL}`;
                    } else if (v.utilities.isNullOrWhitespace(bep.loadBalancerName)) {
                        if (!v.utilities.isNullOrWhitespace(bep.resourceGroupName) || !v.utilities.isNullOrWhitespace(bep.subscriptionId) || !v.utilities.isNullOrWhitespace(bep.location)) {
                            errorMsg += `BackendPool ${bep.name} specified in nic[${index}] doesnt specify loadBalancerName, therefore resourceGroupName, subscriptionId & location cannot be specified.${os.EOL}`;
                        }
                        if (_.isNil(parent.loadBalancerSettings)) {
                            errorMsg += `If loadBalancerSettings is not specified, then BackendPool specified in nic[${index}] must provide both name and loadBalancerName.${os.EOL}`;
                        } else if (!(_.map(parent.loadBalancerSettings.backendPools, (o) => { return o.name; })).includes(bep.name)) {
                            errorMsg += `BackendPool ${bep.name} specified in nic[${index}] is not valid.${os.EOL}`;
                        }
                    }
                });
                nic.inboundNatRulesNames.forEach((inboundNatRulesName) => {
                    if (!_.isNil(parent.scaleSetSettings)) {
                        errorMsg += `nic[${index}].inboundNatRulesNames cannot be specified for scalesets.${os.EOL}`;
                    } else if (_.isNil(parent.loadBalancerSettings)) {
                        errorMsg += `inboundNatRules cannot be specified in nic[${index}] if load balancer is not specified.${os.EOL}`;
                    } else {
                        let nat = _.isString(inboundNatRulesName) ? {name: inboundNatRulesName} : inboundNatRulesName;
                        if (v.utilities.isNullOrWhitespace(nat.name)) {
                            errorMsg += `inboundNatRules specified in nic[${index}] must have name.${os.EOL}`;
                        } else if (!v.utilities.isNullOrWhitespace(nat.loadBalancerName)) {
                            errorMsg += `inboundNatRule ${nat.name} specified in nic[${index}] cannot reference an existing loadBalancer.${os.EOL}`;
                        } else if (!v.utilities.isNullOrWhitespace(nat.resourceGroupName) || !v.utilities.isNullOrWhitespace(nat.subscriptionId) || !v.utilities.isNullOrWhitespace(nat.location)) {
                            errorMsg += `inboundNatRule ${nat.name} specified in nic[${index}] cannot specify loadBalancer, therefore resourceGroupName, subscriptionId & location cannot be specified as well.${os.EOL}`;
                        } else if (!(_.map(parent.loadBalancerSettings.inboundNatRules, (o) => { return o.name; })).includes(nat.name)) {
                            errorMsg += `InboundNatRule ${nat.name} specified in nic[${index}] is not valid.${os.EOL}`;
                        }
                    }
                });
                nic.inboundNatPoolNames.forEach((inboundNatPoolName) => {
                    if (_.isNil(parent.scaleSetSettings)) {
                        errorMsg += `nic[${index}].inboundNatPoolNames can only be specified for scalesets.${os.EOL}`;
                    } else {
                        let pool = _.isString(inboundNatPoolName) ? {name: inboundNatPoolName} : inboundNatPoolName;
                        if (v.utilities.isNullOrWhitespace(pool.name)) {
                            errorMsg += `inboundNatPool specified in nic[${index}] must have name.${os.EOL}`;
                        } else if (v.utilities.isNullOrWhitespace(pool.loadBalancerName)) {
                            if (!v.utilities.isNullOrWhitespace(pool.resourceGroupName) || !v.utilities.isNullOrWhitespace(pool.subscriptionId) || !v.utilities.isNullOrWhitespace(pool.location)) {
                                errorMsg += `inboundNatPool ${pool.name} specified in nic[${index}] doesnt specify loadBalancerName, therefore resourceGroupName, subscriptionId & location cannot be specified.${os.EOL}`;
                            }
                            if (_.isNil(parent.loadBalancerSettings)) {
                                errorMsg += `If loadBalancerSettings is not specified, then inboundNatPool specified in nic[${index}] must provide both name and loadBalancerName.${os.EOL}`;
                            } else if (!(_.map(parent.loadBalancerSettings.inboundNatPools, (o) => { return o.name; })).includes(pool.name)) {
                                errorMsg += `InboundNatPool ${pool.name} specified in nic[${index}] is not valid.${os.EOL}`;
                            }
                        }
                    }
                });
            });
            if (!v.utilities.isNullOrWhitespace(errorMsg)) {
                return {
                    result: false,
                    message: errorMsg
                };
            }

            if (!_.isNil(parent.scaleSetSettings)) {
                if ((_.filter(value, (o) => { return (o.location !== parent.scaleSetSettings.location || o.subscriptionId !== parent.scaleSetSettings.subscriptionId); })).length > 0) {
                    return {
                        result: false,
                        message: 'Network interfaces must be in the same location & subscription as virtual machines scale sets.'
                    };
                }
            } else if ((_.filter(value, (o) => { return (o.location !== parent.location || o.subscriptionId !== parent.subscriptionId); })).length > 0) {
                return {
                    result: false,
                    message: 'Network interfaces must be in the same location & subscription as virtual machines.'
                };
            }
        } else {
            return {
                result: false,
                message: 'Virtual machine must have 1 primary NetworkInterface.'
            };
        }
        return result;
    },
    availabilitySet: (value, parent) => {
        if (v.utilities.isNullOrWhitespace(value.name)) {
            return { result: true };
        }
        if (value.resourceGroupName !== parent.resourceGroupName || value.location !== parent.location
            || value.subscriptionId !== parent.subscriptionId) {
            return {
                result: false,
                message: 'Virtual Machine must be in the same resource group, location and subscription than Availability Set'
            };
        }
        return {
            validations: avSetSettings.validations
        };
    },
    tags: v.tagsValidations,
    loadBalancerSettings: (value, parent) => {
        if (_.isNil(value)) {
            return { result: true };
        } else if (_.isNil(parent.scaleSetSettings) && value.inboundNatPools.length > 0) {
            return {
                result: false,
                message: '.loadBalancerSettings.inboundNatPools can only be specified with scalesets'
            };
        }
        if (!_.isNil(parent.scaleSetSettings)) {
            if (value.subscriptionId !== parent.scaleSetSettings.subscriptionId) {
                return {
                    result: false,
                    message: 'Virtual Machine scale set must be in the same subscription than Load Balancer'
                };
            }
        } else {
            if (value.subscriptionId !== parent.subscriptionId) {
                return {
                    result: false,
                    message: 'Virtual Machine must be in the same subscription than Load Balancer'
                };
            }
        }

        return {
            validations: loadBalancerSettingsValidations
        };
    },
    applicationGatewaySettings: (value, parent) => {
        if (_.isNil(value)) {
            return { result: true };
        }

        // TODO - Add subscription and location validations
        return {
            result: true
        };
    },
    scaleSetSettings: (value, parent) => {
        if (_.isNil(value)) {
            return { result: true };
        }
        // if (!_.isNil(parent.osDisk.encryptionSettings)) {
        //     return {
        //         result: false,
        //         message: '.osDisk.encryptionSettings cannot be provided for scalesets.'
        //     };
        // }

        if (parent.osDisk.createOption === 'attach') {
            return {
                result: false,
                message: '.osDisk.createOption cannot be attach for scalesets'
            };
        }

        if ((parent.dataDisks.disks) && _.some(parent.dataDisks.disks, (value) => {
            return value.createOption === 'attach';
        })) {
            return {
                result: false,
                message: 'createOption attach is not allowed for scaleset data disks'
            };
        }

        if (value.location !== parent.virtualNetwork.location || value.subscriptionId !== parent.virtualNetwork.subscriptionId) {
            return {
                result: false,
                message: 'Scale set must be in the same location and subscription than virtual network'
            };
        }

        return {
            validations: scaleSetSettings.validations
        };
    },
    extensions: (value, parent) => {
        if (_.isNil(value)) {
            return { result: true };
        }
        value.forEach((ext) => {
            if (!_.isNil(parent.scaleSetSettings) && ext.protectedSettings.hasOwnProperty('reference') && ext.protectedSettings.reference.hasOwnProperty('keyVault')) {
                return {
                    result: false,
                    message: '.extensions.protectedSettings cannot be KeyVault reference for scalesets'
                };
            }
        });

        return {
            validations: vmExtensions.validations
        };
    },
    secrets: (value, parent) => {
        if (_.isNil(value)) {
            return {
                result: true
            };
        }

        if (!_.isArray(value)) {
            return {
                result: false,
                message: 'Value must be an array'
            };
        }

        if (value.length === 0) {
            return {
                result: true
            };
        }

        let vm = parent;
        return {
            validations: {
                keyVault: (value) => {
                    if (_.isNil(value)) {
                        return {
                            result: false,
                            message: 'Value cannot be undefined or null'
                        };
                    }

                    // KeyVault and VM cannot be in different regions
                    if (vm.location !== value.location) {
                        return {
                            result: false,
                            message: 'Virtual Machine must be in the same location as the KeyVault used for secrets'
                        };
                    }

                    return {
                        validations: resources.resourceReferenceValidations
                    };
                },
                certificates: (value) => {
                    if (!_.isArray(value) || value.length === 0) {
                        return {
                            result: false,
                            message: 'Value must be a non-empty array'
                        };
                    }


                    return {
                        validations: {
                            certificateUrl: v.validationUtilities.isNotNullOrWhitespace,
                            certificateStore: (value) => {
                                if (vm.osType === 'windows' && v.utilities.isNullOrWhitespace(value)) {
                                    return {
                                        result: false,
                                        message: `Value must be provided for osType === '${vm.osType}'`
                                    };
                                } else if (vm.osType === 'linux' && !v.utilities.isNullOrWhitespace(value)) {
                                    return {
                                        result: false,
                                        message: `Value must not be provided for osType === '${vm.osType}'`
                                    };
                                }

                                return {
                                    result: true
                                };
                            }
                        }
                    };
                }
            }
        };
    },
    usePlan: (value, parent) => {
        // Value must be specified and must be a boolean
        let result = v.validationUtilities.isBoolean(value);
        if (result.result === false) {
            return result;
        }

        if ((value) && (parent.osDisk.createOption !== 'fromImage')) {
            return {
                result: false,
                message: 'Value cannot be true if .osDisk.createOption is not fromImage'
            };
        }

        // For managed disks, imageReference.id cannot be specified
        // For managed disks, osDisk.images cannot be a non-zero length array
        if (parent.storageAccounts.managed) {
            if ((value) && (parent.imageReference.id)) {
                return {
                    result: false,
                    message: 'Value cannot be true if .imageReference.id is specified'
                };
            }
        } else {
            if ((value) && (_.isArray(parent.osDisk.images) && (parent.osDisk.images.length > 0))) {
                return {
                    result: false,
                    message: 'Value cannot be true if .osDisk.images has a non-zero length'
                };
            }
        }

        return {
            result: true
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
    customData: (value) => {
        return {
            osProfile: {
                customData: value
            }
        };
    },
    imageReference: (value, key, index, parent) => {
        if (parent.osDisk.createOption === 'fromImage') {
            if ((parent.storageAccounts.managed) || (_.isUndefined(parent.osDisk.images))) {
                return {
                    storageProfile: {
                        imageReference: value
                    }
                };
            }
        }
    },
    osDisk: (value, key, index, parent, parentAccumulator, buildingBlockSettings) => {
        let instance = {
            name: parent.name.concat('-os'),
            createOption: value.createOption,
            caching: value.caching,
            osType: parent.osType
        };

        if (value.hasOwnProperty('diskSizeGB')) {
            instance.diskSizeGB = value.diskSizeGB;
        }

        // The disk is pre-encrypted, so just set the fields.  If the disk is not pre-encrypted, this will be handled by an extension later.
        if ((value.encryptionSettings) && (value.encryptionSettings.diskEncryptionKey)) {
            instance.encryptionSettings = {
                enabled: true,
                diskEncryptionKey: {
                    sourceVault: {
                        id: resources.resourceId(
                            value.encryptionSettings.diskEncryptionKey.keyVault.subscriptionId,
                            value.encryptionSettings.diskEncryptionKey.keyVault.resourceGroupName,
                            'Microsoft.KeyVault/vaults',
                            value.encryptionSettings.diskEncryptionKey.keyVault.name
                        )
                    },
                    secretUrl: value.encryptionSettings.diskEncryptionKey.secretUrls[index]
                }
            };

            if (value.encryptionSettings.keyEncryptionKey) {
                instance.encryptionSettings.keyEncryptionKey = {
                    sourceVault: {
                        id: resources.resourceId(
                            value.encryptionSettings.keyEncryptionKey.keyVault.subscriptionId,
                            value.encryptionSettings.keyEncryptionKey.keyVault.resourceGroupName,
                            'Microsoft.KeyVault/vaults',
                            value.encryptionSettings.keyEncryptionKey.keyVault.name
                        )
                    },
                    keyUrl: value.encryptionSettings.keyEncryptionKey.keyUrls.length === 1 ?
                        value.encryptionSettings.keyEncryptionKey.keyUrls[0] :
                        value.encryptionSettings.keyEncryptionKey.keyUrls[index]
                };
            }
        }

        if (value.createOption === 'attach') {
            if (parent.storageAccounts.managed) {
                // name cannot be changed for an attached, managed disk
                delete instance.name;
                instance.managedDisk = {
                    id: value.images[index]
                };
            } else {
                instance.vhd = {
                    uri: value.images[index]
                };
            }
        } else if (value.createOption === 'fromImage') {
            if (parent.storageAccounts.managed) {
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

                // This is handled one of two ways for unmanaged.  If we are using "standard" images, the imageReference object is used.
                // If we are using custom images, the images field should point to the image we want to use.
                if (value.images) {
                    instance.image = {
                        uri: value.images[0]
                    };
                }
            }
        }

        return {
            storageProfile: {
                osDisk: instance
            }
        };
    },
    dataDisks: (value, key, index, parent, parentAccumulator, buildingBlockSettings) => {
        let disks = [];
        if (value.disks) {
            // If we have non-empty data disks...
            for (let i = 0; i < value.disks.length; i++) {
                if (value.disks[i].createOption === 'fromImage') {
                    if (parent.storageAccounts.managed) {
                        // fromImage uses the imageReference property for managed data disks
                        let disk = {
                            createOption: 'fromImage',
                            caching: value.disks[i].caching ? value.disks[i].caching : value.caching,
                            managedDisk: {
                                storageAccountType: parent.storageAccounts.skuType
                            }
                        };

                        disks.push(disk);
                    }
                    else {
                        for (let j = 0; j < value.disks[i].images.length; j++) {
                            let disk = {
                                createOption: 'fromImage',
                                caching: value.disks[i].caching ? value.disks[i].caching : value.caching,
                                image: {
                                    uri: value.disks[i].images[j]
                                }
                            };

                            disks.push(disk);
                        }
                    }
                } else if (value.disks[i].createOption === 'attach') {
                    // This is an array of arrays containing blob uris or Microsoft.Compute/disk resource Ids
                    for (let j = 0; j < value.disks[i].images[index].length; j++) {
                        let disk = {
                            createOption: 'attach',
                            caching: value.disks[i].caching ? value.disks[i].caching : value.caching
                        };

                        if (parent.storageAccounts.managed) {
                            disk.managedDisk = {
                                id: value.disks[i].images[index][j]
                            };
                        } else {
                            disk.vhd = {
                                uri: value.disks[i].images[index][j]
                            };
                        }
                        disks.push(disk);
                    }
                }
            }
        }

        // We have gone through the disks array, so now we need to fill up the rest with emptys
        // _.times() returns an empty array if value.count - disks.length is <= 0, which is what we want.
        disks = disks.concat(_.times(value.count - disks.length, () => {
            let disk = {
                diskSizeGB: value.diskSizeGB,
                caching: value.caching,
                createOption: 'empty'
            };

            if (parent.storageAccounts.managed) {
                disk.managedDisk = {
                    storageAccountType: parent.storageAccounts.skuType
                };
            }

            return disk;
        }));

        // Now go through and name and number
        for (let i = 0; i < disks.length; i++) {
            disks[i].name = `${parent.name}-dataDisk${i + 1}`;
            disks[i].lun = i;
            if ((disks[i].createOption === 'empty') || (disks[i].createOption === 'fromImage')) {
                if (!parent.storageAccounts.managed) {
                    let storageAccounts = _.cloneDeep(parent.storageAccounts.accounts);
                    parentAccumulator.storageAccounts.forEach((account) => {
                        storageAccounts.push(account.name);
                    });
                    let storageAccountToUse = index % storageAccounts.length;
                    disks[i].vhd = {
                        uri: `http://${storageAccounts[storageAccountToUse]}.blob.${buildingBlockSettings.cloud.suffixes.storageEndpoint}/vhds/${parent.name}-dataDisk${i + 1}.vhd`
                    };
                }
            } else if (disks[i].createOption === 'attach') {
                if (parent.storageAccounts.managed) {
                    // If we are managed, the name cannot be changed.
                    delete disks[i].name;
                }
            }
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
                    id: resources.resourceId(n.subscriptionId, n.resourceGroupName, 'Microsoft.Network/networkInterfaces', n.name),
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
    computerNamePrefix: (value, key, index, parent) => {
        let cn;
        if (!_.isNil(parent.scaleSetSettings)) {
            cn = v.utilities.isNullOrWhitespace(value) ? parent.namePrefix : value;
        } else {
            cn = v.utilities.isNullOrWhitespace(value) ? `${parent.namePrefix}-vm${index + 1}` : value.concat(index + 1);
        }
        return {
            osProfile: {
                computerName: cn
            }
        };
    },
    adminPassword: (value, key, index, parent) => {
        if (parent.osType === 'windows') {
            return {
                osProfile: {
                    adminPassword: AUTHENTICATION_PLACEHOLDER,
                    windowsConfiguration: {
                        provisionVmAgent: true
                    }
                }
            };
        } else {
            return {
                osProfile: {
                    adminPassword: AUTHENTICATION_PLACEHOLDER,
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
                                keyData: AUTHENTICATION_PLACEHOLDER
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
    },
    secrets: (value) => {
        let secrets = _.map(value, (value) => {
            return {
                sourceVault: {
                    id: resources.resourceId(value.keyVault.subscriptionId, value.keyVault.resourceGroupName, 'Microsoft.KeyVault/vaults', value.keyVault.name)
                },
                vaultCertificates: _.map(value.certificates, (value) => {
                    let certificate = {
                        certificateUrl: value.certificateUrl
                    };

                    if (value.certificateStore) {
                        certificate.certificateStore = value.certificateStore;
                    }

                    return certificate;
                })
            };
        });

        return {
            osProfile: {
                secrets: secrets
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

        result.push(stamp);
    }
    return result;
}

function transform(settings, buildingBlockSettings) {
    let accumulator = {
        publicIpAddresses: [],
        networkInterfaces: [],
        availabilitySet: [],
        scaleSets: [],
        autoScaleSettings: [],
        loadBalancers: [],
        applicationGateways: []
    };

    // process storageAccounts
    accumulator.storageAccounts = (storageSettings.transform(settings.storageAccounts, settings)).accounts;

    // process diagnosticStorageAccounts
    accumulator.diagnosticStorageAccounts = (storageSettings.transform(settings.diagnosticStorageAccounts, settings)).accounts;

    // process availabilitySet
    if (!v.utilities.isNullOrWhitespace(settings.availabilitySet.name)) {
        _.merge(accumulator, avSetSettings.transform(settings.availabilitySet, settings));
    }

    // process VMs
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

        // TODO!!!!! For now, we are going to remove osProfile if the osDisk is attach because it will fail otherwise.  Find a better way to do this!
        if (vmProperties.storageProfile.osDisk.createOption === 'attach') {
            delete vmProperties.osProfile;
        }

        let plan = null;
        if (vmStamp.usePlan) {
            plan = {
                name: vmStamp.imageReference.sku,
                publisher: vmStamp.imageReference.publisher,
                product: vmStamp.imageReference.offer
            };
        }

        // process extensions. Transform extensions in VM to shaped required by virtualMachineExtensionsSettings
        let extensionParam = [{
            vms: [vmStamp.name],
            extensions: vmStamp.extensions
        }];
        let transformedExtensions = vmExtensions.transform(extensionParam).extensions;

        // We are going to enable encryption here by adding the disk encryption extension to the end of the extensions.
        // We will build off of the unprocessed vmSettings and put the extension in the building block extension format
        // and reuse our code. ;)
        let encryptionSettings = {
            useExtension: false
        };

        if ((vmStamp.osDisk.encryptionSettings) && (_.isNil(vmStamp.osDisk.encryptionSettings.diskEncryptionKey))) {
            let diskEncryptionExtension = [{
                vms: [vmStamp.name],
                extensions: [{
                    name: vmStamp.osType === 'windows' ? 'AzureDiskEncryption' : 'AzureDiskEncryptionForLinux',
                    publisher: 'Microsoft.Azure.Security',
                    type: vmStamp.osType === 'windows' ? 'AzureDiskEncryption' : 'AzureDiskEncryptionForLinux',
                    typeHandlerVersion: vmStamp.osType === 'windows' ? '1.1' : '0.1',
                    autoUpgradeMinorVersion: true,
                    settings: {
                        AADClientID: vmStamp.osDisk.encryptionSettings.aadClientId,
                        KeyVaultURL: vmStamp.osDisk.encryptionSettings.diskEncryptionKeyVaultUrl,
                        KeyEncryptionKeyURL: vmStamp.osDisk.encryptionSettings.keyEncryptionKeyUrl,
                        KeyEncryptionAlgorithm: 'RSA-OAEP',
                        VolumeType: vmStamp.osDisk.encryptionSettings.volumeType,
                        EncryptionOperation: 'EnableEncryption'
                    },
                    protectedSettings: {
                    }
                }]
            }];

            if (vmStamp.osType === 'windows') {
                diskEncryptionExtension[0].extensions[0].forceUpdateTag = '1.0';
            } else {
                diskEncryptionExtension[0].extensions[0].settings.SequenceVersion = '1.0';
            }

            if (vmStamp.osDisk.encryptionSettings.aadClientCertThumbprint) {
                diskEncryptionExtension[0].extensions[0].settings.AADClientCertThumbprint = vmStamp.osDisk.encryptionSettings.aadClientCertThumbprint;
            }

            // if (vmStamp.osDisk.encryptionSettings.aadClientSecret) {
            //     diskEncryptionExtension[0].extensions[0].protectedSettings.AADClientSecret = vmStamp.osDisk.encryptionSettings.aadClientSecret;
            // }

            // // If we are linux, we have another "key"
            // if (vmStamp.osDisk.encryptionSettings.passphrase) {
            //     diskEncryptionExtension[0].extensions[0].protectedSettings.Passphrase = vmStamp.osDisk.encryptionSettings.passphrase;
            // }
            if (vmStamp.osDisk.encryptionSettings.protectedSettings) {
                // If there are extra things in the keyVault reference, the templates will fail
                if (vmStamp.osDisk.encryptionSettings.protectedSettings.reference) {
                    diskEncryptionExtension[0].extensions[0].protectedSettings.reference = {
                        keyVault: {
                            id: resources.resourceId(
                                vmStamp.osDisk.encryptionSettings.protectedSettings.reference.keyVault.subscriptionId,
                                vmStamp.osDisk.encryptionSettings.protectedSettings.reference.keyVault.resourceGroupName,
                                'Microsoft.KeyVault/vaults',
                                vmStamp.osDisk.encryptionSettings.protectedSettings.reference.keyVault.name)
                        },
                        secretName: vmStamp.osDisk.encryptionSettings.protectedSettings.reference.secretName
                    };

                } else {
                    diskEncryptionExtension[0].extensions[0].protectedSettings = {};
                    if (vmStamp.osDisk.encryptionSettings.protectedSettings.aadClientSecret) {
                        diskEncryptionExtension[0].extensions[0].protectedSettings.AADClientSecret =
                        vmStamp.osDisk.encryptionSettings.protectedSettings.aadClientSecret;
                    }

                    if (vmStamp.osDisk.encryptionSettings.protectedSettings.passphrase) {
                        diskEncryptionExtension[0].extensions[0].protectedSettings.Passphrase =
                        vmStamp.osDisk.encryptionSettings.protectedSettings.passphrase;
                    }
                }
            }

            if (vmStamp.osDisk.encryptionSettings.diskFormatQuery) {
                // We need to make sure to format the json correctly for the template engine.  We'll assume an array for now.  Validate this!
                let json = JSON.stringify(vmStamp.osDisk.encryptionSettings.diskFormatQuery);
                diskEncryptionExtension[0].extensions[0].settings.DiskFormatQuery = `[${json}`;
                diskEncryptionExtension[0].extensions[0].settings.EncryptionOperation = 'EnableEncryptionFormat';
            }

            // We need to put this at the end of all of our extensions since they could install things.
            transformedExtensions = transformedExtensions.concat(vmExtensions.transform(diskEncryptionExtension).extensions);
            encryptionSettings = {
                useExtension: true,
                extensionName: vmStamp.osType === 'windows' ? 'AzureDiskEncryption' : 'AzureDiskEncryptionForLinux',
                diskEncryptionKeyVault: resources.resourceId(
                    vmStamp.osDisk.encryptionSettings.diskEncryptionKeyVault.subscriptionId,
                    vmStamp.osDisk.encryptionSettings.diskEncryptionKeyVault.resourceGroupName,
                    'Microsoft.KeyVault/vaults', vmStamp.osDisk.encryptionSettings.diskEncryptionKeyVault.name),
                //bekKeyVaultUrl: vmStamp.osDisk.encryptionSettings.bekKeyVaultUrl,
                keyEncryptionKeyVault: resources.resourceId(
                    vmStamp.osDisk.encryptionSettings.keyEncryptionKeyVault.subscriptionId,
                    vmStamp.osDisk.encryptionSettings.keyEncryptionKeyVault.resourceGroupName,
                    'Microsoft.KeyVault/vaults', vmStamp.osDisk.encryptionSettings.keyEncryptionKeyVault.name),
                keyEncryptionKeyUrl: vmStamp.osDisk.encryptionSettings.keyEncryptionKeyUrl
            };
        }

        result.virtualMachines.push({
            properties: vmProperties,
            name: vmStamp.name,
            extensions: transformedExtensions,
            resourceGroupName: vmStamp.resourceGroupName,
            subscriptionId: vmStamp.subscriptionId,
            location: vmStamp.location,
            tags: vmStamp.tags,
            plan: plan,
            encryptionSettings: encryptionSettings
        });

        return result;
    }, { virtualMachines: [] });
    accumulator.virtualMachines = vms.virtualMachines;

    // process scale set
    if (!_.isNil(settings.scaleSetSettings)) {
        let ssParam = scaleSetSettings.transform(settings.scaleSetSettings, accumulator);

        accumulator.scaleSets = ssParam.scaleSets;
        accumulator.autoScaleSettings = ssParam.autoScaleSettings;

        // For scaleset, we dont need to create nics, availabilitySet, pips & VMs. Remove from accumulator
        accumulator.virtualMachines = [];
        accumulator.networkInterfaces = [];
        accumulator.availabilitySet = [];
        accumulator.publicIpAddresses = [];
    }

    // Process secrets.  We need to put them into a shape that can be assigned to a secureString parameter.
    if (settings.osType === 'linux' && !_.isNil(settings.sshPublicKey)) {
        accumulator.authentication = settings.sshPublicKey;
    } else {
        accumulator.authentication = settings.adminPassword;
    }

    // If it is not a KeyVault reference, shape it into a parameter.
    if (_.isUndefined(accumulator.authentication.reference)) {
        accumulator.authentication = {
            value: accumulator.authentication
        };
    }

    // process load balancer if specified
    if (settings.loadBalancerSettings) {
        let natRules = [];
        settings.loadBalancerSettings.inboundNatRules.forEach((rule) => {
            for (let i = 0; i < settings.vmCount; i++) {
                let natRule = {
                    name: `${rule.name}-${i}`,
                    frontendIPConfigurationName: rule.frontendIPConfigurationName,
                    protocol: rule.protocol,
                    enableFloatingIP: rule.enableFloatingIP,
                    frontendPort: rule.startingFrontendPort + i,
                    backendPort: rule.backendPort,
                    idleTimeoutInMinutes: rule.idleTimeoutInMinutes
                };
                natRules.push(natRule);
            }
        });
        settings.loadBalancerSettings.inboundNatRules = natRules;

        let lbResults = lbSettings.process({ settings: settings.loadBalancerSettings, buildingBlockSettings: buildingBlockSettings });
        accumulator.loadBalancers = lbResults.parameters.loadBalancers;
        accumulator.publicIpAddresses = _.concat(accumulator.publicIpAddresses, lbResults.parameters.publicIpAddresses);
    }

    // process applicationGatewaySettings if specified
    if (settings.applicationGatewaySettings) {
        let gatewayResults = gatewaySettings.process({ settings: settings.applicationGatewaySettings, buildingBlockSettings: buildingBlockSettings});
        accumulator.applicationGateways = gatewayResults.parameters.applicationGateways;
        accumulator.publicIpAddresses = _.concat(accumulator.publicIpAddresses, gatewayResults.parameters.publicIpAddresses);
    }

    return accumulator;
}

function process({ settings, buildingBlockSettings, defaultSettings }) {
    settings = _.castArray(settings);
    // Merge

    let mergedSettings = _.map(settings, (value) => {
        return merge({
            settings: value,
            buildingBlockSettings: buildingBlockSettings,
            defaultSettings: defaultSettings
        });
    });

    // Validate
    let errors = validate(mergedSettings);

    if (errors.length > 0) {
        throw new Error(JSON.stringify(errors));
    }

    // Transform
    let results = _.map(mergedSettings, (value) => {
        let result = transform(value, buildingBlockSettings);
        let resourceGroups = resources.extractResourceGroups(
            result.availabilitySet,
            result.diagnosticStorageAccounts,
            result.loadBalancers,
            result.applicationGateways,
            result.scaleSets,
            result.autoScaleSettings,
            result.networkInterfaces,
            result.publicIpAddresses,
            result.storageAccounts,
            result.virtualMachines,
            result.applicationGateways
        );

        return {
            resourceGroups: resourceGroups,
            parameters: result
        };
    });

    // We need to merge and unique-ify the resource groups and get things into the right shape
    let uniqueResourceGroups = _.uniqWith(_.reduce(results, (result, value) => {
        return result.concat(value.resourceGroups);
    }, []), _.isEqual);
    // Extract the secrets into their own object and delete them from the virtual machine parameters
    results = _.transform(results, (result, value) => {
        let secrets = {
            authentication: value.parameters.authentication,
            extensionsProtectedSettings: []
        };
        delete value.parameters.authentication;
        if (value.parameters.scaleSets.length === 0) {
            value.parameters.virtualMachines = _.map(value.parameters.virtualMachines, (value) => {
                let protectedSettings = {};
                value.extensions = _.map(value.extensions, (value, index) => {
                    //protectedSettings.push(value.extensionProtectedSettings);
                    protectedSettings[index.toString()] = value.extensionProtectedSettings;
                    delete value.extensionProtectedSettings;
                    return value;
                });
                secrets.extensionsProtectedSettings.push(protectedSettings);
                return value;
            });
        } else {
            // We need to change the shape a bit to support VMSS
            secrets.extensionsProtectedSettings = {};
            value.parameters.scaleSets = _.map(value.parameters.scaleSets, (value, index) => {
                // let protectedSettings = {};
                // // These have already been transformed at this point.  Should we change this?
                // // We need to alter the shape for VMSS.  The way extensions work is different
                // // than VMs.  We need to pull the whole set of extensions into the secureObject
                // // so we can union() them in the template.
                // value.properties.virtualMachineProfile.extensionProfile.extensions =
                //     _.map(value.properties.virtualMachineProfile.extensionProfile.extensions, (value, index) => {
                //         // We will reverse what the scale set settings did....for now.
                //         if (value.properties.protectedSettings.reference) {
                //             protectedSettings[index.toString()] = value.properties.protectedSettings;
                //         } else {
                //             protectedSettings[index.toString()] = {
                //                 value: JSON.stringify(value.properties.protectedSettings)
                //             };
                //         }
                //         delete value.properties.protectedSettings;
                //         return value;
                //     });
                // secrets.extensionsProtectedSettings.push(protectedSettings);

                // secrets.extensionsProtectedSettings.push(
                //     {
                //         virtualMachineProfile: {
                //             extensionProfile: {
                //                 extensions: value.properties.virtualMachineProfile.extensionProfile.extensions
                //             }
                //         }
                //     }
                // );

                // We have to use the string replace trick
                secrets.extensionsProtectedSettings[index.toString()] = value.properties.virtualMachineProfile.extensionProfile.extensions;
                value.properties.virtualMachineProfile.extensionProfile.extensions = '$EXTENSIONS$';
                return value;
            });
        }
        result.secrets.secrets.push(secrets);
        result.virtualMachineParameters.push(value.parameters);
    }, {
        virtualMachineParameters: [],
        secrets: {
            secrets: []
        }
    });

    // Extract any protected settings from extensions on the virtual machines
    return {
        resourceGroups: uniqueResourceGroups,
        parameters: {
            virtualMachines: results.virtualMachineParameters,
            secrets: results.secrets
        }
    };
}

exports.process = process;
