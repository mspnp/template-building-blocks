'use strict';

var _ = require('lodash');
var pipSettings = require('./publicIpAddressSettings.js');
var resources = require('./resources.js');
let v = require('./validation.js');

const NETWORKINTERFACE_SETTINGS_DEFAULTS = {
    isPrimary: true,
    isPublic: true,
    privateIPAllocationMethod: 'Dynamic',
    publicIPAllocationMethod: 'Dynamic',
    startingIPAddress: '',
    enableIPForwarding: false,
    domainNameLabelPrefix: '',
    dnsServers: [],
    backendPoolsNames: [],
    inboundNatRulesNames: []
};

function merge(settings, userDefaults) {
    let defaults = (userDefaults) ? [NETWORKINTERFACE_SETTINGS_DEFAULTS, userDefaults] : NETWORKINTERFACE_SETTINGS_DEFAULTS;
    return v.merge(settings, defaults);
}

let validIPAllocationMethods = ['Static', 'Dynamic'];

let isValidIPAllocationMethod = (ipAllocationMethod) => {
    return v.utilities.isStringInArray(ipAllocationMethod, validIPAllocationMethods);
};

let networkInterfaceValidations = {
    enableIPForwarding: v.validationUtilities.isBoolean,
    subnetName: v.validationUtilities.isNotNullOrWhitespace,
    privateIPAllocationMethod: (value, parent) => {
        let result = {
            result: true
        };

        if (!isValidIPAllocationMethod(value)) {
            result = {
                result: false,
                message: `Valid values are ${validIPAllocationMethods.join(',')}`
            };
        } else if ((value === 'Static') && (!v.utilities.networking.isValidIpAddress(parent.startingIPAddress))) {
            result = {
                result: false,
                message: 'If privateIPAllocationMethod is Static, startingIPAddress must be a valid IP address'
            };
        }

        return result;
    },
    publicIPAllocationMethod: (value) => {
        return {
            result: isValidIPAllocationMethod(value),
            message: `Valid values are ${validIPAllocationMethods.join(',')}`
        };
    },
    isPrimary: v.validationUtilities.isBoolean,
    isPublic: v.validationUtilities.isBoolean,
    dnsServers: (value) => {
        if (_.isNil(value)) {
            return {
                result: false,
                message: 'Value cannot be null or undefined'
            };
        } else if (value.length === 0) {
            return {
                result: true
            };
        } else {
            return {
                validations: v.validationUtilities.isValidIpAddress
            };
        }
    }
};

function intToIP(int) {
    var part1 = int & 255;
    var part2 = ((int >> 8) & 255);
    var part3 = ((int >> 16) & 255);
    var part4 = ((int >> 24) & 255);

    return part4 + '.' + part3 + '.' + part2 + '.' + part1;
}

function ipToInt(ip) {
    var ipl = 0;
    ip.split('.').forEach(function (octet) {
        ipl <<= 8;
        ipl += parseInt(octet);
    });
    return (ipl >>> 0);
}

function createPipParameters(parent, vmIndex) {
    let settings = {
        name: `${parent.name}-pip`,
        publicIPAllocationMethod: parent.publicIPAllocationMethod
    };
    if (!v.utilities.isNullOrWhitespace(parent.domainNameLabelPrefix)) {
        settings.domainNameLabel = `${parent.domainNameLabelPrefix}${vmIndex}`;
    }
    return pipSettings.transform({
        settings: settings,
        buildingBlockSettings: {
            subscriptionId: parent.subscriptionId,
            resourceGroupName: parent.resourceGroupName,
            location: parent.location
        }
    });
}

function transform(settings, parent, vmIndex) {
    return _.transform(settings, (result, nic, index) => {
        nic.name = parent.name.concat('-nic', (index + 1));

        let instance = {
            resourceGroupName: nic.resourceGroupName,
            subscriptionId: nic.subscriptionId,
            location: nic.location,
            name: nic.name,
            properties: {
                ipConfigurations: [
                    {
                        name: 'ipconfig1',
                        properties: {
                            privateIPAllocationMethod: nic.privateIPAllocationMethod,
                            subnet: {
                                id: resources.resourceId(parent.virtualNetwork.subscriptionId, parent.virtualNetwork.resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets', parent.virtualNetwork.name, nic.subnetName)
                            }
                        }
                    }
                ],
                enableIPForwarding: nic.enableIPForwarding,
                dnsSettings: {
                    dnsServers: nic.dnsServers,
                    appliedDnsServers: nic.dnsServers
                },
                primary: nic.isPrimary
            }
        };

        if (parent.loadBalancerSettings) {
            nic.backendPoolsNames.forEach((pool, index) => {
                if (index === 0) {
                    instance.properties.ipConfigurations[0].properties.loadBalancerBackendAddressPools = [];
                }
                instance.properties.ipConfigurations[0].properties.loadBalancerBackendAddressPools.push({
                    id: resources.resourceId(parent.loadBalancerSettings.subscriptionId,
                        parent.loadBalancerSettings.resourceGroupName,
                        'Microsoft.Network/loadBalancers/backendAddressPools',
                        parent.loadBalancerSettings.name,
                        pool)
                });
            });

            nic.inboundNatRulesNames.forEach((natRuleName, index) => {
                if (index === 0) {
                    instance.properties.ipConfigurations[0].properties.loadBalancerInboundNatRules = [];
                }
                instance.properties.ipConfigurations[0].properties.loadBalancerInboundNatRules.push({
                    id: resources.resourceId(parent.loadBalancerSettings.subscriptionId,
                        parent.loadBalancerSettings.resourceGroupName,
                        'Microsoft.Network/loadBalancers/inboundNatRules',
                        parent.loadBalancerSettings.name,
                        `${natRuleName}-${vmIndex}`)
                });
            });
        }

        if (nic.isPublic) {
            let pip = createPipParameters(nic, vmIndex);
            result.pips = _.concat(result.pips, pip.publicIpAddresses);

            instance.properties.ipConfigurations[0].properties.publicIPAddress = {
                id: resources.resourceId(nic.subscriptionId, nic.resourceGroupName, 'Microsoft.Network/publicIPAddresses', pip.publicIpAddresses.name)
            };
        }

        if (_.toLower(nic.privateIPAllocationMethod) === 'static') {
            let updatedIp = intToIP(ipToInt(nic.startingIPAddress) + vmIndex);
            instance.properties.ipConfigurations[0].properties.privateIPAddress = updatedIp;
        }
        result.nics.push(instance);
        return result;
    }, {
        pips: [],
        nics: []
    });
}

exports.transform = transform;
exports.merge = merge;
exports.validations = networkInterfaceValidations;
