'use strict';

let _ = require('lodash');
let v = require('./validation');
let resources = require('./resources');
let publicIpAddressSettings = require('./publicIpAddressSettings');
const os = require('os');

const APPLICATIONGATEWAY_SETTINGS_DEFAULTS = {
    sku: {
        name: 'Standard_Small',
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
    requestRoutingRules: [
        {
            ruleType: 'Basic' // this is set by default, should be here or not ?
        }
    ],
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
    },
    sslPolicy: {},
    tags: {
        'deployedWith': 'bbv2'
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
        if (_.isNil(srcValue) || srcValue.length === 0) {
            return objValue;
        } else {
            delete objValue[0].name;
        }
    }
}

let validSkuNames = ['Standard_Small', 'Standard_Medium', 'Standard_Large', 'WAF_Medium', 'WAF_Large'];
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
let validSslPolicyTypes = ['Predefined', 'Predefined'];
let validApplicationGatewayRequestRoutingRuleTypes = ['Basic', 'PathBasedRouting'];
let validCookieBasedAffinityValues = ['Enabled', 'Disabled'];
let validPrivateIPAllocationMethods = ['Static', 'Dynamic'];


let isValidSkuName = (skuName) => {
    return v.utilities.isStringInArray(skuName, validSkuNames);
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

let isValidPrivateIPAllocationMethod = (privateIPAllocationMethod) => {
    return v.utilities.isStringInArray(privateIPAllocationMethod, validPrivateIPAllocationMethods);
};

let frontendIPConfigurationValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    applicationGatewayType: (value) => {
        return {
            result: isValidAppGatewayType(value),
            message: `Valid values are ${validAppGatewayTypes.join(' ,')}`
        };
    },
    internalApplicationGatewaySettings: (value, parent) => {
        if (parent.applicationGatewayType === 'Public') {
            if (!_.isNil(value)) {
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
        return _.isNil(value) ? {
            result: true
        } : {
                validations: publicIpAddressSettings.validations
            };
    }
};

let skuValidations = {
    name: (value) => {
        return {
            result: isValidSkuName(value),
            message: `Valid values are ${validSkuNames.join(' ,')}`
        };
    },
    tier: (value) => {
        return {
            result: isValidSkuTier(value),
            message: `Valid values are ${validSkuTiers.join(' ,')}`
        };
    }
};

let frontendPortsValidations = {
    port: v.validationUtilities.isValidPortRange
};

let protocolValidation = (protocol) => {
    if (_.isNil(protocol)) {
        return { result: true };
    }

    return {
        result: isValidProtocol(protocol),
        message: `Valid values are ${validProtocols.join(' ,')}`
    };
};

let cookieBasedAffinityValidation = (value) => {
    return {
        result: isValidCookieBasedAffinityValue(value),
        message: `Valid values are ${validCookieBasedAffinityValues.join(' ,')}`
    };
};

let requestRoutingRuleTypeValidation = (value) => {
    return {
        result: isValidRequestRoutingRuleType(value),
        message: `Valid values are ${validApplicationGatewayRequestRoutingRuleTypes.join(' ,')}`
    };
};

let backendHttpSettingsCollectionValidations = {
    port: v.validationUtilities.isValidPortRange,
    protocol: protocolValidation,
    cookieBasedAffinity: cookieBasedAffinityValidation,
    pickHostNameFromBackendAddress: v.validationUtilities.isBoolean,
    probeEnabled: v.validationUtilities.isBoolean,
    // probeName: v.validationUtilities.isNotNullOrWhitespace NOT a required field!
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
    sslCertificates: () => {
        return { result: true };
        // TODO: if provided, than in correct schema
    },
    authenticationCertificates: () => {
        return { result: true };
        // TODO: if provided, than in correct schema
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
    backendAddressPools: () => {
        return { result: true };
        // TODO: Mixing IP/FQDN and virtual machine types is not allowed.
    },
    backendHttpSettingsCollection: () => {
        return { validations: backendHttpSettingsCollectionValidations };
    },
    httpListeners: (value, parent) => {
        if (_.isNil(value) || value.length === 0) {
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
        if (_.isNil(value) || value.length === 0) {
            return { result: true };
        }

        let baseSettings = parent;
        let urlPathMapsValidations = {
            defaultBackendAddressPoolName: (value) => {
                let result = {
                    result: false,
                    message: `Invalid defaultBackendAddressPoolName ${value} in urlPathMaps`
                };
                let matched = _.filter(baseSettings.backendAddressPools, (o) => { return (o.name === value); });
                return (baseSettings.backendAddressPools.length > 0 && matched.length === 0) ? result : { result: true };
            },
            defaultBackendHttpSettingName: (value) => {
                let result = {
                    result: false,
                    message: `Invalid defaultBackendHttpSettingName ${value} in urlPathMaps`
                };
                let matched = _.filter(baseSettings.backendHttpSettingsCollection, (o) => { return (o.name === value); });
                return (baseSettings.backendHttpSettingsCollection.length > 0 && matched.length === 0) ? result : { result: true };
            },
            pathRules: (value) => {
                if (_.isNil(value) || value.length === 0) {
                    return {
                        result: false,
                        message: 'pathRules must be specified'
                    };
                }
                let errorMessage = '';
                value.forEach((pathRule, index) => {
                    if (_.isNil(pathRule.paths) || pathRule.paths.length === 0) {
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
                    backendAddressPoolName: (value) => {
                        let result = {
                            result: false,
                            message: `Invalid backendAddressPoolName ${value} in urlPathMaps`
                        };
                        let matched = _.filter(baseSettings.backendAddressPools, (o) => { return (o.name === value); });
                        return (baseSettings.backendAddressPools.length > 0 && matched.length === 0) ? result : { result: true };
                    },
                    backendHttpSettingName: (value) => {
                        let result = {
                            result: false,
                            message: `Invalid backendHttpSettingName ${value} in urlPathMaps`
                        };
                        let matched = _.filter(baseSettings.backendHttpSettingsCollection, (o) => { return (o.name === value); });
                        return (baseSettings.backendHttpSettingsCollection.length > 0 && matched.length === 0) ? result : { result: true };
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
        if (_.isNil(value) || value.length === 0) {
            return { result: true };
        }

        let baseSettings = parent;
        let requestRoutingRulesValidations = {
            name: v.validationUtilities.isNotNullOrWhitespace,
            backendAddressPoolName: (value) => {
                let result = {
                    result: false,
                    message: `Invalid backendAddressPoolName ${value} in requestRoutingRules`
                };
                let matched = _.filter(baseSettings.backendAddressPools, (o) => { return (o.name === value); });
                return (baseSettings.backendAddressPools.length > 0 && matched.length === 0) ? result : { result: true };
            },
            backendHttpSettingName: (value) => {
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
                if (value === 'PathBasedRouting' && (_.isNil(baseSettings.urlPathMaps) || baseSettings.urlPathMaps.length === 0)) {
                    return {
                        result: false,
                        message: 'At least one urlPathMaps must be specified when ruleType is PathBasedRouting'
                    };
                }

                return { validations: requestRoutingRuleTypeValidation };
            },
            urlPathMapName: (value, parent) => {
                if (_.isNil(value) && parent.ruleType !== 'PathBasedRouting') {
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
        if (_.isNil(value)) {
            return { result: true };
        }

        let probesValidation = {
            protocol: protocolValidation,
            pickHostNameFromBackendHttpSettings: v.validationUtilities.isBoolean
            // TODO: valid host
            // TODO: valid path
            // TODO: valid interval
            // TODO: valid timeout
            // TODO: valid unhealthyThreshold
            // TODO: valid pickHostNameFromBackendHttpSettings
            // TODO: valid minServers
            // TODO: match
        };
        return { validations: probesValidation };
    },
    redirectConfigurations: () => {
        return { result: true };
        // TODO: if provided, than in correct schema
    },
    webApplicationFirewallConfiguration: () => {
        return { result: true };
        // TODO: valid enabled
        // TODO: valid firewallMode
        // TODO: valid ruleSetType
        // TODO: valid ruleSetVersion
        // TODO: valid disabledRuleGroups
    },
    sslPolicy: () => {
        return { result: true };
        // TODO: if provided, than in correct schema
    }
};

let processProperties = {
    sku: (value, key, parent, properties) => {
        properties['sku'] = value;
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

            if (!_.isNil(pool.backendAddresses) && pool.backendAddresses.length > 0) {
                addressPool.properties.backendAddresses = pool.backendAddresses;
            } else if (!_.isNil(pool.backendIPConfigurations) && pool.backendIPConfigurations.length > 0) {
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
            if (!_.isNil(httpSetting.probeName)) {
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
                return {
                    name: rule.name,
                    properties: {
                        paths: rule.paths,
                        backendAddressPool: {
                            id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/backendAddressPools', parent.name, rule.backendAddressPoolName)
                        },
                        backendHttpSettings: {
                            id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/backendHttpSettingsCollection', parent.name, rule.backendHttpSettingName)
                        }
                    }
                };
            });

            return {
                name: map.name,
                properties: {
                    defaultBackendAddressPool: {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/backendAddressPools', parent.name, map.defaultBackendAddressPoolName)
                    },
                    defaultBackendHttpSettings: {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/backendHttpSettingsCollection', parent.name, map.defaultBackendHttpSettingName)
                    },
                    pathRules: rules
                }
            };
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
                routingRule.properties.backendAddressPool = {
                    id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/backendAddressPools', parent.name, rule.backendAddressPoolName)
                };
                routingRule.properties.backendHttpSettings = {
                    id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/applicationGateways/backendHttpSettingsCollection', parent.name, rule.backendHttpSettingName)
                };
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
        tags: settings.tags,
        properties: gatewayProperties
    }];

    return accumulator;
}

exports.merge = merge;
exports.validations = applicationGatewayValidations;
exports.transform = transform;
