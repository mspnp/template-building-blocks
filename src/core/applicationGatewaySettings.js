'use strict';

let _ = require('lodash');
let v = require('./validation');
let resources = require('./resources');
let publicIpAddressSettings = require('./publicIpAddressSettings');
const os = require('os');

const APPLICATIONGATEWAY_SETTINGS_DEFAULTS = {
    sku: {
        size: 'Small',
        tier: 'Standard',
        capacity: 2
    },
    gatewayIPConfigurations: [],
    sslCertificates: [],
    authenticationCertificates: [],
    frontendIPConfigurations: [
        {
            name: 'default-feConfig',
            applicationGatewayType: 'Public'
        }
    ],
    frontendPorts: [],
    backendAddressPools: [],
    backendHttpSettingsCollection: [
        {
            cookieBasedAffinity: 'Disabled',
            pickHostNameFromBackendAddress: false,
            probeEnabled: true,
            requestTimeout: 30
        }
    ],
    httpListeners: [
        {
            requireServerNameIndication: false
        }
    ],
    urlPathMaps: [],
    requestRoutingRules: [],
    probes: [
        {
            interval: 30,
            timeout: 30,
            unhealthyThreshold: 3,
            pickHostNameFromBackendHttpSettings: false,
            minServers: 0
        }
    ],
    redirectConfigurations: [],
    webApplicationFirewallConfiguration: {
        enabled: true,
        firewallMode: 'Prevention',
        ruleSetType: 'OWASP',
        ruleSetVersion: '3.0',
        disabledRuleGroups: []
    }
};

function merge({ settings, buildingBlockSettings, defaultSettings }) {
    let defaults = (defaultSettings) ? [APPLICATIONGATEWAY_SETTINGS_DEFAULTS, defaultSettings] : APPLICATIONGATEWAY_SETTINGS_DEFAULTS;
    let mergedSettings = v.merge(settings, defaults, defaultsCustomizer);

    mergedSettings.frontendIPConfigurations = _.map(mergedSettings.frontendIPConfigurations, (config) => {
        // If needed, we need to build up a publicIpAddress from the information we have here so it can be merged and validated.
        // TODO: appGatewayFrontendIP of ApplicationGateway can only reference a PublicIPAddress with IpAllocationMethod as dynamic.
        if (config.applicationGatewayType === 'Public') {
            let publicIpAddress = {
                name: `${settings.name}-${config.name}-pip`,
                publicIPAllocationMethod: 'Dynamic',
                domainNameLabel: config.domainNameLabel,
                publicIPAddressVersion: config.publicIPAddressVersion,
                resourceGroupName: mergedSettings.resourceGroupName,
                subscriptionId: mergedSettings.subscriptionId,
                location: mergedSettings.location
            };
            config.publicIpAddress = publicIpAddressSettings.merge({ settings: publicIpAddress });
        }
        return config;
    });

    return mergedSettings;
}

function defaultsCustomizer(objValue, srcValue, key) {
    if (key === 'frontendIPConfigurations') {
        if (_.isUndefined(srcValue) || !_.isArray(srcValue) || srcValue.length === 0) {
            return objValue;
        } else {
            delete objValue[0].name;
        }
    }
}

let validStandardSkuSizes = ['Small', 'Medium', 'Large'];
let validWAFSkuSizes = ['Medium', 'Large'];
let validSkuTiers = ['Standard', 'WAF'];
let validRedirectTypes = ['Permanent', 'Found', 'SeeOther', 'Temporary'];
let validAppGatewayTypes = ['Public', 'Internal'];
let validProtocols = ['Http', 'Https'];
let validFirewallModes = ['Detection', 'Prevention'];
let validApplicationGatewaySslCipherSuites = [
    'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384',
    'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256',
    'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA',
    'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA',
    'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384',
    'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256',
    'TLS_DHE_RSA_WITH_AES_256_CBC_SHA',
    'TLS_DHE_RSA_WITH_AES_128_CBC_SHA',
    'TLS_RSA_WITH_AES_256_GCM_SHA384',
    'TLS_RSA_WITH_AES_128_GCM_SHA256',
    'TLS_RSA_WITH_AES_256_CBC_SHA256',
    'TLS_RSA_WITH_AES_128_CBC_SHA256',
    'TLS_RSA_WITH_AES_256_CBC_SHA',
    'TLS_RSA_WITH_AES_128_CBC_SHA',
    'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
    'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
    'TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384',
    'TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256',
    'TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA',
    'TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA',
    'TLS_DHE_DSS_WITH_AES_256_CBC_SHA256',
    'TLS_DHE_DSS_WITH_AES_128_CBC_SHA256',
    'TLS_DHE_DSS_WITH_AES_256_CBC_SHA',
    'TLS_DHE_DSS_WITH_AES_128_CBC_SHA',
    'TLS_RSA_WITH_3DES_EDE_CBC_SHA'
];
let validSslProtocols = ['TLSv1_0', 'TLSv1_1', 'TLSv1_2'];
let validSslPolicyTypes = ['Predefined', 'Custom'];
let validApplicationGatewayRequestRoutingRuleTypes = ['Basic', 'PathBasedRouting'];
let validCookieBasedAffinityValues = ['Enabled', 'Disabled'];
let validRuleSetTypes = ['OWASP'];
let validSslPolicyNames = ['AppGwSslPolicy20150501', 'AppGwSslPolicy20170401', 'AppGwSslPolicy20170401S'];

let isNilOrInRange = (value, from, to) => {
    return {
        result: _.isUndefined(value) || _.inRange(_.toSafeInteger(value), from, to),
        message: `Valid values are from ${from} to ${to}`
    };
};

let isValidStandardSkuSize = (size) => {
    return v.utilities.isStringInArray(size, validStandardSkuSizes);
};

let isValidWAFSkuSize = (size) => {
    return v.utilities.isStringInArray(size, validWAFSkuSizes);
};

let isValidSkuTier = (skuTier) => {
    return v.utilities.isStringInArray(skuTier, validSkuTiers);
};

let isValidRedirectType = (redirectType) => {
    return v.utilities.isStringInArray(redirectType, validRedirectTypes);
};

let isValidAppGatewayType = (appGatewayType) => {
    return v.utilities.isStringInArray(appGatewayType, validAppGatewayTypes);
};

let isValidProtocol = (protocol) => {
    return v.utilities.isStringInArray(protocol, validProtocols);
};

let isValidFirewallMode = (firewallMode) => {
    return v.utilities.isStringInArray(firewallMode, validFirewallModes);
};

let isValidSslCipherSuite = (sslCipherSuite) => {
    return v.utilities.isStringInArray(sslCipherSuite, validApplicationGatewaySslCipherSuites);
};

let isValidSslProtocol = (sslProtocol) => {
    return v.utilities.isStringInArray(sslProtocol, validSslProtocols);
};

let isValidSslPolicyType = (sslPolicyType) => {
    return v.utilities.isStringInArray(sslPolicyType, validSslPolicyTypes);
};

let isValidRequestRoutingRuleType = (requestRoutingRuleType) => {
    return v.utilities.isStringInArray(requestRoutingRuleType, validApplicationGatewayRequestRoutingRuleTypes);
};

let isValidCookieBasedAffinityValue = (cookieBasedAffinityValue) => {
    return v.utilities.isStringInArray(cookieBasedAffinityValue, validCookieBasedAffinityValues);
};

let isValidRuleSetType = (ruleSetType) => {
    return v.utilities.isStringInArray(ruleSetType, validRuleSetTypes);
};

let isValidSslPolicyName = (policyName) => {
    return v.utilities.isStringInArray(policyName, validSslPolicyNames);
};


let frontendIPConfigurationValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    applicationGatewayType: (value) => {
        return {
            result: isValidAppGatewayType(value),
            message: `Valid values are ${validAppGatewayTypes.join(',')}`
        };
    },
    internalApplicationGatewaySettings: (value, parent) => {
        if (parent.applicationGatewayType === 'Public') {
            if (!_.isUndefined(value)) {
                return {
                    result: false,
                    message: 'If applicationGatewayType is Public, internalApplicationGatewaySettings cannot be specified'
                };
            } else {
                return { result: true };
            }
        }
        let internalApplicationGatewaySettingsValidations = {
            subnetName: v.validationUtilities.isNotNullOrWhitespace,
        };
        return {
            validations: internalApplicationGatewaySettingsValidations
        };
    },
    publicIpAddress: (value) => {
        return _.isUndefined(value) ? {
            result: true
        } : {
            validations: publicIpAddressSettings.validations
        };
    }
};

let skuValidations = {
    size: (value, parent) => {
        let result = {
            result: false,
            message: 'Unable to validate size due to invalid tier value'
        };

        if (parent.tier === 'Standard') {
            result = {
                result: isValidStandardSkuSize(value),
                message: `Valid values are ${validStandardSkuSizes.join(',')}`
            };
        } else if (parent.tier === 'WAF') {
            result = {
                result: isValidWAFSkuSize(value),
                message: `Valid values are ${validWAFSkuSizes.join(',')}`
            };
        }

        return result;
    },
    tier: (value) => {
        return {
            result: isValidSkuTier(value),
            message: `Valid values are ${validSkuTiers.join(',')}`
        };
    }
};

let frontendPortsValidations = {
    port: v.validationUtilities.isValidPortRange
};

let protocolValidation = (protocol) => {
    if (_.isUndefined(protocol)) {
        return { result: true };
    }

    return {
        result: isValidProtocol(protocol),
        message: `Valid values are ${validProtocols.join(',')}`
    };
};

let cookieBasedAffinityValidation = (value) => {
    return {
        result: isValidCookieBasedAffinityValue(value),
        message: `Valid values are ${validCookieBasedAffinityValues.join(',')}`
    };
};

let requestRoutingRuleTypeValidation = (value) => {
    return {
        result: isValidRequestRoutingRuleType(value),
        message: `Valid values are ${validApplicationGatewayRequestRoutingRuleTypes.join(',')}`
    };
};

let backendHttpSettingsCollectionValidations = {
    port: v.validationUtilities.isValidPortRange,
    protocol: protocolValidation,
    cookieBasedAffinity: cookieBasedAffinityValidation,
    pickHostNameFromBackendAddress: v.validationUtilities.isBoolean,
    probeEnabled: v.validationUtilities.isBoolean
};

let disabledRuleGroupsValidations = (value) => {
    if (_.isUndefined(value) || (_.isArray(value) && value.length === 0)) {
        return { result: true };
    }
    let errorMessage = '';
    value.forEach((ruleGroup, index) => {
        let result = v.validationUtilities.isNotNullOrWhitespace(ruleGroup.ruleGroupName);
        if (result.result === false) {
            errorMessage += `disabledRuleGroups[${index}].ruleGroupName ` + result.message + `.${os.EOL}`;
        }
    });
    return {
        result: errorMessage === '',
        message: errorMessage
    };
};

let backendAddressesValidations = (value) => {
    if (_.isUndefined(value)) {
        return { result: true };
    }

    let validations = {
        fqdn: (value, parent) => {
            if ((!_.isUndefined(value) && !_.isUndefined(parent.ipAddress)) ||
                (_.isUndefined(value) && _.isUndefined(parent.ipAddress))) {
                return {
                    result: false,
                    message: 'Either ipAddress or fqdn must be specified'
                };
            }
            if (_.isUndefined(value)) {
                return { result: true };
            }
            return { validations: v.validationUtilities.isNotNullOrWhitespace };
        },
        ipAddress: (value, parent) => {
            if ((!_.isUndefined(value) && !_.isUndefined(parent.fqdn)) ||
                (_.isUndefined(value) && _.isUndefined(parent.fqdn))) {
                return {
                    result: false,
                    message: 'Either ipAddress or fqdn must be specified'
                };
            }
            if (_.isUndefined(value)) {
                return { result: true };
            }
            return { validations: v.validationUtilities.isValidIpAddress };
        }
        // TODO: Mixing IP/FQDN and virtual machine types is not allowed.
        // can have nic but not both
    };
    return { validations: validations };
};

let applicationGatewayValidations = {
    //TODO: ApplicationGatewaySubnetCannotBeUsedByOtherResources\\\
    //TODO: ApplicationGatewayBackendAddressPoolAlreadyHasBackendAddresses: nic cannot reference Backend Address Pool because the pool contains
    // BackendAddresses. A pool can contain only one of these three: IPs in BackendAddresses array, IPConfigurations of standalone Network Interfaces,
    // IPConfigurations of VM Scale Set Network Interfaces. Also, two VM Scale Sets cannot use the same Backend Address Pool.\\\
    sku: () => {
        return { validations: skuValidations };
    },
    gatewayIPConfigurations: () => {
        return {
            validations: {
                subnetName: v.validationUtilities.isNotNullOrWhitespace
            }
        };
    },
    sslCertificates: (value) => {
        if (_.isUndefined(value)) {
            return { result: true };
        }

        let validations = {
            name: v.validationUtilities.isNotNullOrWhitespace,
            data: v.validationUtilities.isNotNullOrWhitespace,
            password: v.validationUtilities.isNotNullOrWhitespace,
        };
        return { validations: validations };
    },
    authenticationCertificates: (value) => {
        if (_.isUndefined(value)) {
            return { result: true };
        }

        let validations = {
            name: v.validationUtilities.isNotNullOrWhitespace,
            data: v.validationUtilities.isNotNullOrWhitespace
        };
        return { validations: validations };
    },
    frontendIPConfigurations: (value) => {
        let publicConfigs = _.filter(value, c => { return c.applicationGatewayType === 'Public'; });
        let internalConfigs = _.filter(value, c => { return c.applicationGatewayType === 'Internal'; });
        if (value.length > 2 || publicConfigs.length > 1 || internalConfigs.length > 1) {
            return {
                result: false,
                message: 'There can be only 2 frontendIPConfigurations, 1 private and 1 public'
            };
        }
        return {
            validations: frontendIPConfigurationValidations
        };
    },
    frontendPorts: () => {
        return {
            validations: frontendPortsValidations
        };
    },
    backendAddressPools: (value) => {
        if (_.isUndefined(value)) {
            return { result: true };
        }

        let backendAddressPoolsValidations = {
            backendAddresses: backendAddressesValidations,
        };

        return {
            validations: backendAddressPoolsValidations
        };
    },
    backendHttpSettingsCollection: () => {
        return { validations: backendHttpSettingsCollectionValidations };
    },
    httpListeners: (value, parent) => {
        if (_.isUndefined(value) || (_.isArray(value) && value.length === 0)) {
            return { result: true };
        }

        let baseSettings = parent;
        let httpListenersValidations = {
            frontendIPConfigurationName: (value) => {
                let result = {
                    result: false,
                    message: `Invalid frontendIPConfigurationName ${value} in httpListeners`
                };
                let matched = _.filter(baseSettings.frontendIPConfigurations, (o) => { return (o.name === value); });
                return matched.length > 0 ? { result: true } : result;
            },
            frontendPortName: (value) => {
                let result = {
                    result: false,
                    message: `Invalid frontendPortName ${value} in httpListeners`
                };
                let matched = _.filter(baseSettings.frontendPorts, (o) => { return (o.name === value); });
                return (baseSettings.frontendPorts.length > 0 && matched.length === 0) ? result : { result: true };
            },
            protocol: protocolValidation,
            requireServerNameIndication: v.validationUtilities.isBoolean
        };
        return {
            validations: httpListenersValidations
        };
    },
    urlPathMaps: (value, parent) => {
        if (_.isUndefined(value) || (_.isArray(value) && value.length === 0)) {
            return { result: true };
        }

        let baseSettings = parent;
        let urlPathMapsValidations = {
            defaultBackendAddressPoolName: (value, parent) => {
                if (parent.defaultRedirectConfigurationName) {
                    if (_.isUndefined(value)) {
                        return {
                            result: true
                        };
                    } else {
                        return {
                            result: false,
                            message: 'Value cannot be specified if defaultRedirectConfigurationName is defined'
                        };
                    }
                }
                let result = {
                    result: false,
                    message: `Invalid defaultBackendAddressPoolName ${value} in urlPathMaps`
                };
                let matched = _.filter(baseSettings.backendAddressPools, (o) => { return (o.name === value); });
                return (baseSettings.backendAddressPools.length > 0 && matched.length === 0) ? result : { result: true };
            },
            defaultBackendHttpSettingName: (value, parent) => {
                if (parent.defaultRedirectConfigurationName) {
                    if (_.isUndefined(value)) {
                        return {
                            result: true
                        };
                    } else {
                        return {
                            result: false,
                            message: 'Value cannot be specified if defaultRedirectConfigurationName is defined'
                        };
                    }
                }
                let result = {
                    result: false,
                    message: `Invalid defaultBackendHttpSettingName ${value} in urlPathMaps`
                };
                let matched = _.filter(baseSettings.backendHttpSettingsCollection, (o) => { return (o.name === value); });
                return (baseSettings.backendHttpSettingsCollection.length > 0 && matched.length === 0) ? result : { result: true };
            },
            defaultRedirectConfigurationName: (value, parent) => {
                if ((parent.defaultBackendAddressPoolName) || (parent.defaultBackendHttpSettingName)) {
                    if (_.isUndefined(value)) {
                        return {
                            result: true
                        };
                    } else {
                        return {
                            result: false,
                            message: 'Value cannot be specified if defaultBackendAddressPoolName or defaultBackendHttpSettingName is defined'
                        };
                    }
                }
                let result = {
                    result: false,
                    message: `Invalid defaultRedirectConfigurationName ${value} in urlPathMaps`
                };
                let matched = _.filter(baseSettings.redirectConfigurations, (o) => { return (o.name === value); });
                return (baseSettings.redirectConfigurations.length > 0 && matched.length === 0) ? result : { result: true };
            },
            pathRules: (value) => {
                if (_.isUndefined(value) || (_.isArray(value) && value.length === 0)) {
                    return {
                        result: false,
                        message: 'pathRules must be specified'
                    };
                }
                let errorMessage = '';
                value.forEach((pathRule, index) => {
                    if (_.isUndefined(pathRule.paths) || pathRule.paths.length === 0) {
                        errorMessage += `At least one path must be specified pathRules[${index}].paths.${os.EOL}`;
                    }
                });
                if (errorMessage) {
                    return {
                        result: false,
                        message: errorMessage
                    };
                }
                let pathRulesValidations = {
                    backendAddressPoolName: (value, parent) => {
                        if (parent.redirectConfigurationName) {
                            if (_.isUndefined(value)) {
                                return {
                                    result: true
                                };
                            } else {
                                return {
                                    result: false,
                                    message: 'Value cannot be specified if redirectConfigurationName is defined'
                                };
                            }
                        }

                        let result = {
                            result: false,
                            message: `Invalid backendAddressPoolName ${value} in urlPathMaps`
                        };
                        let matched = _.filter(baseSettings.backendAddressPools, (o) => { return (o.name === value); });
                        return (baseSettings.backendAddressPools.length > 0 && matched.length === 0) ? result : { result: true };
                    },
                    backendHttpSettingName: (value, parent) => {
                        if (parent.redirectConfigurationName) {
                            if (_.isUndefined(value)) {
                                return {
                                    result: true
                                };
                            } else {
                                return {
                                    result: false,
                                    message: 'Value cannot be specified if redirectConfigurationName is defined'
                                };
                            }
                        }

                        let result = {
                            result: false,
                            message: `Invalid backendHttpSettingName ${value} in urlPathMaps`
                        };
                        let matched = _.filter(baseSettings.backendHttpSettingsCollection, (o) => { return (o.name === value); });
                        return (baseSettings.backendHttpSettingsCollection.length > 0 && matched.length === 0) ? result : { result: true };
                    },
                    redirectConfigurationName: (value, parent) => {
                        if ((parent.backendAddressPoolName) || (parent.backendHttpSettingName)) {
                            if (_.isUndefined(value)) {
                                return {
                                    result: true
                                };
                            } else {
                                return {
                                    result: false,
                                    message: 'Value cannot be specified if backendAddressPoolName or backendHttpSettingName is defined'
                                };
                            }
                        }
                        let result = {
                            result: false,
                            message: `Invalid redirectConfigurationName ${value} in urlPathMaps`
                        };
                        let matched = _.filter(baseSettings.redirectConfigurations, (o) => { return (o.name === value); });
                        return (baseSettings.redirectConfigurations.length > 0 && matched.length === 0) ? result : { result: true };
                    }
                };
                return { validations: pathRulesValidations };
            }
        };
        return {
            validations: urlPathMapsValidations
        };
    },
    requestRoutingRules: (value, parent) => {
        if (_.isUndefined(value) || (_.isArray(value) && value.length === 0)) {
            return { result: true };
        }

        let baseSettings = parent;
        let requestRoutingRulesValidations = {
            name: v.validationUtilities.isNotNullOrWhitespace,
            backendAddressPoolName: (value, parent) => {
                if (parent.ruleType === 'PathBasedRouting') {
                    if (_.isUndefined(value)) {
                        return { result: true };
                    } else {
                        return {
                            result: false,
                            message: 'Value cannot be specified for ruleType === PathBasedRouting'
                        };
                    }
                } else if ((parent.ruleType === 'Basic') && (parent.redirectConfigurationName)) {
                    if (_.isUndefined(value)) {
                        return { result: true };
                    } else {
                        return {
                            result: false,
                            message: 'Value cannot be specified if redirectConfigurationName is specified'
                        };
                    }
                }
                let result = {
                    result: false,
                    message: `Invalid backendAddressPoolName ${value} in requestRoutingRules`
                };
                let matched = _.filter(baseSettings.backendAddressPools, (o) => { return (o.name === value); });
                return (baseSettings.backendAddressPools.length > 0 && matched.length === 0) ? result : { result: true };
            },
            backendHttpSettingName: (value, parent) => {
                if (parent.ruleType === 'PathBasedRouting') {
                    if (_.isUndefined(value)) {
                        return { result: true };
                    } else {
                        return {
                            result: false,
                            message: 'Value cannot be specified for ruleType === PathBasedRouting'
                        };
                    }
                } else if ((parent.ruleType === 'Basic') && (parent.redirectConfigurationName)) {
                    if (_.isUndefined(value)) {
                        return { result: true };
                    } else {
                        return {
                            result: false,
                            message: 'Value cannot be specified if redirectConfigurationName is specified'
                        };
                    }
                }
                let result = {
                    result: false,
                    message: `Invalid backendHttpSettingName ${value} in requestRoutingRules`
                };
                let matched = _.filter(baseSettings.backendHttpSettingsCollection, (o) => { return (o.name === value); });
                return (baseSettings.backendHttpSettingsCollection.length > 0 && matched.length === 0) ? result : { result: true };
            },
            httpListenerName: (value) => {
                let result = {
                    result: false,
                    message: `Invalid httpListenerName ${value} in requestRoutingRules`
                };
                let matched = _.filter(baseSettings.httpListeners, (o) => { return (o.name === value); });
                return (baseSettings.httpListeners.length > 0 && matched.length === 0) ? result : { result: true };
            },
            ruleType: (value) => {
                if (value === 'PathBasedRouting' && (_.isUndefined(baseSettings.urlPathMaps) || baseSettings.urlPathMaps.length === 0)) {
                    return {
                        result: false,
                        message: 'At least one urlPathMaps must be specified when ruleType is PathBasedRouting'
                    };
                }

                return { validations: requestRoutingRuleTypeValidation };
            },
            urlPathMapName: (value, parent) => {
                if (_.isUndefined(value) && parent.ruleType !== 'PathBasedRouting') {
                    return { result: true };
                }
                let result = {
                    result: false,
                    message: `Invalid urlPathMapName ${value} in requestRoutingRules`
                };
                let matched = _.filter(baseSettings.urlPathMaps, (o) => { return (o.name === value); });
                return matched.length === 0 ? result : { result: true };
            }
        };
        return {
            validations: requestRoutingRulesValidations
        };
    },
    probes: (value) => {
        if (_.isUndefined(value)) {
            return { result: true };
        }

        let probesValidation = {
            name: v.validationUtilities.isNotNullOrWhitespace,
            protocol: protocolValidation,
            pickHostNameFromBackendHttpSettings: v.validationUtilities.isBoolean,
            interval: (value) => isNilOrInRange(value, 1, 86401),
            timeout: (value) => isNilOrInRange(value, 1, 86401),
            unhealthyThreshold: (value) => isNilOrInRange(value, 1, 21),
            path: (value) => {
                return {
                    result: _.isUndefined(value) || value.indexOf('/') === 0,
                    message: 'Path must start with "/"'
                };
            },
            match: (value) => {
                if (_.isUndefined(value) || _.isUndefined(value.statusCodes)) {
                    return { result: true };
                }

                let validations = {
                    statusCodes: (values) => {
                        let errorMessage = '';
                        values.forEach((value, index) => {
                            if (!/[0-9]{3}/.test(value) && !/[0-9]{3}-[0-9]{3}/.test(value)) {
                                errorMessage += `match.statusCodes[${index}] must be a valid HTTP status code or a range of them.${os.EOL}`;
                            }
                        });
                        return {
                            result: errorMessage === '',
                            message: errorMessage
                        };
                    }
                };
                return { validations: validations };
            },
            minServers: (value) => {
                if (_.isUndefined(value)) {
                    return { result: true };
                }
                return {
                    result: _.isFinite(value) && _.toSafeInteger(value) >= 0,
                    message: 'minServers must be an integer equal or greater than 0'
                };
            }
        };
        return { validations: probesValidation };
    },
    redirectConfigurations: () => {
        let validations = {
            name: v.validationUtilities.isNotNullOrWhitespace,
            redirectType: (value) => {
                return {
                    result: isValidRedirectType(value),
                    message: `Valid values are ${validRedirectTypes.join(',')}`
                };
            },
            targetUrl: (value, parent) => {
                // This canot be specified with targetListenerName
                if ((!_.isUndefined(value)) && (!_.isUndefined(parent.targetListenerName))) {
                    return {
                        result: false,
                        message: 'Value cannot be specified if targetListenerName is specified'
                    };
                }

                if ((_.isUndefined(value)) && (_.isUndefined(parent.targetListenerName))) {
                    return {
                        result: false,
                        message: 'Either targetUrl or targetListenerName must be specified, but not both'
                    };
                }

                if ((_.isUndefined(value)) && (!_.isUndefined(parent.targetListenerName))) {
                    return {
                        result: true
                    };
                }

                if (!_.isUndefined(parent.includePath)) {
                    return {
                        result: false,
                        message: 'Value cannot be specified if includePath is specified'
                    };
                }

                return v.validationUtilities.isNotNullOrWhitespace(value);
            },
            targetListenerName: (value, parent) => {
                // This canot be specified with targetUrl
                if ((!_.isUndefined(value)) && (!_.isUndefined(parent.targetUrl))) {
                    return {
                        result: false,
                        message: 'Value cannot be specified if targetUrl is specified'
                    };
                }

                if ((_.isUndefined(value)) && (_.isUndefined(parent.targetUrl))) {
                    return {
                        result: false,
                        message: 'Either targetListenerName or targetUrl must be specified, but not both'
                    };
                }

                if ((_.isUndefined(value)) && (!_.isUndefined(parent.targetUrl))) {
                    return {
                        result: true
                    };
                }

                return v.validationUtilities.isNotNullOrWhitespace(value);
            },
            includePath: (value, parent) => {
                if (_.isUndefined(value)) {
                    return {
                        result: true
                    };
                }

                if (!_.isUndefined(parent.targetUrl)) {
                    return {
                        result: false,
                        message: 'Value cannot be specified if targetUrl is specified'
                    };
                }

                return v.validationUtilities.isBoolean(value);
            },
            includeQueryString: (value) => {
                if (_.isUndefined(value)) {
                    return {
                        result: true
                    };
                } else {
                    return v.validationUtilities.isBoolean(value);
                }
            }
        };

        return {
            validations: validations
        };
    },
    webApplicationFirewallConfiguration: (value) => {
        if (_.isUndefined(value)) {
            return { result: true };
        }

        let webApplicationFirewallConfigurationValidations = {
            enabled: v.validationUtilities.isBoolean,
            firewallMode: (value) => {
                return {
                    result: isValidFirewallMode(value),
                    message: `Valid values are ${validFirewallModes.join(',')}`
                };
            },
            ruleSetType: (value) => {
                return {
                    result: isValidRuleSetType(value),
                    message: `Valid values for ruleSetType are ${validRuleSetTypes.join(',')}`
                };
            },
            ruleSetVersion: v.validationUtilities.isNotNullOrWhitespace,
            disabledRuleGroups: disabledRuleGroupsValidations
        };
        return { validations: webApplicationFirewallConfigurationValidations };
    },
    sslPolicy: (value) => {
        if (_.isUndefined(value)) {
            return { result: true };
        }

        let sslPolicyValidations = {
            policyType: (value) => {
                return {
                    result: isValidSslPolicyType(value),
                    message: `Valid values for policyType are ${validSslPolicyTypes.join(',')}`
                };
            },
            policyName: (value, parent) => {
                if (_.isUndefined(value)) {
                    return {
                        result: parent.policyType !== 'Predefined',
                        message: 'policyName must be specified when policyType is Predefined'
                    };
                }
                if (parent.policyType === 'Custom') {
                    return {
                        result: false,
                        message: 'policyName cannot be specified when policyType is Custom'
                    };
                }
                return {
                    result: isValidSslPolicyName(value),
                    message: `Valid values for policyType are ${validSslPolicyNames.join(',')}`
                };
            },
            cipherSuites: (value, parent) => {
                if (_.isUndefined(value)) {
                    return {
                        result: parent.policyType !== 'Custom',
                        message: 'cipherSuites must be specified when policyType is Custom'
                    };
                }
                if (parent.policyType === 'Predefined') {
                    return {
                        result: false,
                        message: 'cipherSuites cannot be specified when policyType is Predefined'
                    };
                }

                let errorMessage = '';
                value.forEach((suite, index) => {
                    if (!isValidSslCipherSuite(suite)) {
                        errorMessage += `Valid values for sslPolicy.cipherSuites[${index}] are ${validApplicationGatewaySslCipherSuites.join(',')}.${os.EOL}`;
                    }
                });

                return {
                    result: errorMessage === '',
                    message: errorMessage
                };
            },
            minProtocolVersion:  (value, parent) => {
                if (_.isUndefined(value)) {
                    return {
                        result: parent.policyType !== 'Custom',
                        message: 'minProtocolVersion must be specified when policyType is Custom'
                    };
                }
                if (parent.policyType === 'Predefined') {
                    return {
                        result: false,
                        message: 'minProtocolVersion cannot be specified when policyType is Predefined'
                    };
                }

                return {
                    result: isValidSslProtocol(value),
                    message: `Valid values for policyType are ${validSslProtocols.join(',')}`
                };
            },
            disabledSslProtocols: (value) => {
                if (!_.isUndefined(value)) {
                    return {
                        result: false,
                        message: '"MinProtocolVersion" has been introduced for "SslPolicy" in api-version "2017-06-01". Use "MinProtocolVersion" instead of "DisabledSslProtocols"'
                    };
                }
                return { result: true };
            }
        };
        return { validations: sslPolicyValidations };
    }
};

let processProperties = {
    sku: (value, key, parent, properties) => {
        properties['sku'] = {
            name: `${value.tier}_${value.size}`,
            tier: value.tier,
            capacity: value.capacity
        };
    },
    gatewayIPConfigurations: (value, key, parent, properties) => {
        let gwConfigs = _.map(value, (gwConfig) => {
            return {
                name: gwConfig.name,
                properties: {
                    subnet: {
                        id: resources.resourceId(parent.virtualNetwork.subscriptionId, parent.virtualNetwork.resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets', parent.virtualNetwork.name, gwConfig.subnetName),
                    }
                }
            };
        });
        properties['gatewayIPConfigurations'] = gwConfigs;
    },
    sslCertificates: (value, key, parent, properties) => {
        properties['sslCertificates'] = value;
    },
    authenticationCertificates: (value, key, parent, properties) => {
        properties['authenticationCertificates'] = value;
    },
    frontendIPConfigurations: (value, key, parent, properties) => {
        let feIpConfigs = _.map(value, (config) => {
            if (config.applicationGatewayType === 'Internal') {
                return {
                    name: config.name,
                    properties: {
                        privateIPAllocationMethod: 'Dynamic',
                        subnet: {
                            id: resources.resourceId(parent.virtualNetwork.subscriptionId, parent.virtualNetwork.resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets', parent.virtualNetwork.name, config.internalApplicationGatewaySettings.subnetName),
                        }
                    }
                };
            } else if (config.applicationGatewayType === 'Public') {
                return {
                    name: config.name,
                    properties: {
                        privateIPAllocationMethod: 'Dynamic',
                        publicIPAddress: {
                            id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/publicIPAddresses', config.publicIpAddress.name)
                        }
                    }
                };
            }
        });
        properties['frontendIPConfigurations'] = feIpConfigs;
    },
    frontendPorts: (value, key, parent, properties) => {
        let ports = _.map(value, (port) => {
            return {
                name: port.name,
                properties: {
                    port: port.port
                }
            };
        });
        properties['frontendPorts'] = ports;
    },
    backendAddressPools: (value, key, parent, properties) => {
        let pools = _.map(value, (pool) => {
            let addressPool = {
                name: pool.name,
                properties: {}
            };

            if (!_.isUndefined(pool.backendAddresses) && pool.backendAddresses.length > 0) {
                addressPool.properties.backendAddresses = pool.backendAddresses;
            } else if (!_.isUndefined(pool.backendIPConfigurations) && pool.backendIPConfigurations.length > 0) {
                // TODO: should get the machines dynamically from parent/nameprefix
                addressPool.properties.backendIPConfigurations = pool.backendIPConfigurations;
            }
            return addressPool;
        });
        properties['backendAddressPools'] = pools;
    },
    backendHttpSettingsCollection: (value, key, parent, properties) => {
        let httpSettings = _.map(value, (httpSetting) => {
            let setting = {
                name: httpSetting.name,
                properties: {
                    port: httpSetting.port,
                    protocol: httpSetting.protocol,
                    cookieBasedAffinity: httpSetting.cookieBasedAffinity,
                    pickHostNameFromBackendAddress: httpSetting.pickHostNameFromBackendAddress,
                    probeEnabled: httpSetting.probeEnabled,
                    requestTimeout: httpSetting.requestTimeout
                }
            };
            if (!_.isUndefined(httpSetting.probeName)) {
                setting.properties.probe = {
                    id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/probes', parent.name, httpSetting.probeName)
                };
            }
            return setting;
        });
        properties['backendHttpSettingsCollection'] = httpSettings;
    },
    httpListeners: (value, key, parent, properties) => {
        let listeners = _.map(value, (listener) => {
            return {
                name: listener.name,
                properties: {
                    requireServerNameIndication: listener.requireServerNameIndication,
                    protocol: listener.protocol,
                    frontendIPConfiguration: {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/frontendIPConfigurations', parent.name, listener.frontendIPConfigurationName)
                    },
                    frontendPort: {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/frontendPorts', parent.name, listener.frontendPortName)
                    }
                }
            };
        });
        properties['httpListeners'] = listeners;
    },
    urlPathMaps: (value, key, parent, properties) => {
        properties['urlPathMaps'] = _.map(value, (map) => {
            let rules = _.map(map.pathRules, (rule) => {
                let result = {
                    name: rule.name,
                    properties: {
                        paths: rule.paths
                    }
                };

                if (rule.redirectConfigurationName) {
                    result.properties.redirectConfiguration = {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/redirectConfigurations', parent.name, rule.redirectConfigurationName)
                    };
                } else {
                    result.properties.backendAddressPool = {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/backendAddressPools', parent.name, rule.backendAddressPoolName)
                    };
                    result.properties.backendHttpSettings = {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/backendHttpSettingsCollection', parent.name, rule.backendHttpSettingName)
                    };
                }

                return result;
            });

            let result = {
                name: map.name,
                properties: {
                    pathRules: rules
                }
            };

            if (map.defaultRedirectConfigurationName) {
                result.properties.defaultRedirectConfiguration = {
                    id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/redirectConfigurations', parent.name, map.defaultRedirectConfigurationName)
                };
            } else {
                result.properties.defaultBackendAddressPool = {
                    id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/backendAddressPools', parent.name, map.defaultBackendAddressPoolName)
                };
                result.properties.defaultBackendHttpSettings = {
                    id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/backendHttpSettingsCollection', parent.name, map.defaultBackendHttpSettingName)
                };
            }

            return result;
        });
    },
    requestRoutingRules: (value, key, parent, properties) => {
        properties['requestRoutingRules'] = _.map(value, (rule) => {
            let routingRule = {
                name: rule.name,
                properties: {
                    ruleType: rule.ruleType,
                    httpListener: {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/httpListeners', parent.name, rule.httpListenerName)
                    }
                }
            };

            if (rule.ruleType === 'Basic') {
                if (rule.redirectConfigurationName) {
                    routingRule.properties.redirectConfiguration = {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/redirectConfigurations', parent.name, rule.redirectConfigurationName)
                    };
                } else {
                    routingRule.properties.backendAddressPool = {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/backendAddressPools', parent.name, rule.backendAddressPoolName)
                    };
                    routingRule.properties.backendHttpSettings = {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/backendHttpSettingsCollection', parent.name, rule.backendHttpSettingName)
                    };
                }
            } else {
                routingRule.properties.urlPathMap = {
                    id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/urlPathMaps', parent.name, rule.urlPathMapName)
                };
            }

            return routingRule;
        });
    },
    probes: (value, key, parent, properties) => {
        properties['probes'] = _.map(value, (probe) => {
            return {
                name: probe.name,
                properties: {
                    protocol: probe.protocol,
                    host: probe.host,
                    path: probe.path,
                    interval: probe.interval,
                    timeout: probe.timeout,
                    unhealthyThreshold: probe.unhealthyThreshold,
                    pickHostNameFromBackendHttpSettings: probe.pickHostNameFromBackendHttpSettings,
                    minServers: probe.minServers,
                    match: probe.match
                }
            };
        });
    },
    webApplicationFirewallConfiguration: (value, key, parent, properties) => {
        properties['webApplicationFirewallConfiguration'] = value;
    },
    sslPolicy: (value, key, parent, properties) => {
        properties['sslPolicy'] = value;
    },
    redirectConfigurations: (value, key, parent, properties) => {
        properties['redirectConfigurations'] = _.map(value, (redirect) => {
            let result = {
                name: redirect.name,
                properties: {
                    redirectType: redirect.redirectType
                }
            };

            if (redirect.targetUrl) {
                result.properties.targetUrl = redirect.targetUrl;
            } else if (redirect.targetListenerName) {
                result.properties.targetListener = {
                    id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/httpListeners', parent.name, redirect.targetListenerName)
                };
                // includePath can only be used with targetListener
                if (!_.isUndefined(redirect.includePath)) {
                    result.properties.includePath = redirect.includePath;
                }
            }

            if (!_.isUndefined(redirect.includeQueryString)) {
                result.properties.includeQueryString = redirect.includeQueryString;
            }
            return result;
        });
    }
};

function transform(param) {
    let accumulator = {};

    // Get all the publicIpAddresses required for the app gateway
    let publicConfigs = _.filter(param.frontendIPConfigurations, c => { return c.applicationGatewayType === 'Public'; });
    let pips = _.map(publicConfigs, (config) => {
        if (config.applicationGatewayType === 'Public') {
            return publicIpAddressSettings.transform(config.publicIpAddress).publicIpAddresses;
        }
    });
    if (pips.length > 0) {
        accumulator['publicIpAddresses'] = pips;
    }

    // transform all properties of the loadbalancerSettings in RP shape
    let gatewayProperties = _.transform(param, (properties, value, key, obj) => {
        if (typeof processProperties[key] === 'function') {
            processProperties[key](value, key, obj, properties);
        }
        return properties;
    }, {});

    accumulator['applicationGateway'] = [{
        name: param.name,
        resourceGroupName: param.resourceGroupName,
        subscriptionId: param.subscriptionId,
        location: param.location,
        tags: param.tags,
        properties: gatewayProperties
    }];

    return accumulator;
}

exports.merge = merge;
exports.validations = applicationGatewayValidations;
exports.transform = transform;
