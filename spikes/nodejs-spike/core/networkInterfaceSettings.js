'use strict';

var _ = require('lodash');
var pipSettings = require('./pipSettings.js');
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
    dnsServers: []
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
        namePrefix: parent.name,
        publicIPAllocationMethod: parent.publicIPAllocationMethod
    };
    if(!v.utilities.isNullOrWhitespace(parent.domainNameLabelPrefix)) {
        settings.domainNameLabel = `${parent.domainNameLabelPrefix}${vmIndex}`;
    }
    return pipSettings.processPipSettings(settings);
}

function process(settings, parent, vmIndex) {
    return _.transform(settings, (result, n, index) => {
        n.name = parent.name.concat('-nic', (index + 1));

        let instance = {
            name: n.name,
            ipConfigurations: [
                {
                    name: 'ipconfig1',
                    properties: {
                        privateIPAllocationMethod: n.privateIPAllocationMethod,
                        subnet: {
                            id: resources.resourceId(parent.virtualNetwork.subscriptionId, parent.virtualNetwork.resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets', parent.virtualNetwork.name, n.subnetName)
                        }
                    }
                }
            ],
            primary: n.isPrimary,
            enableIPForwarding: n.enableIPForwarding,
            dnsSettings: {
                dnsServers: n.dnsServers,
                appliedDnsServers: n.dnsServers
            }
        };

        if (n.isPublic) {
            let pip = createPipParameters(n, vmIndex);
            result.pips = result.pips.concat(pip);

            instance.ipConfigurations[0].properties.publicIPAddress = {
                id: resources.resourceId(n.subscriptionId, n.resourceGroupName, 'Microsoft.Network/publicIPAddresses', pip[0].name)
            };
        }

        if (_.toLower(n.privateIPAllocationMethod) === 'static') {
            let updatedIp = intToIP(ipToInt(n.startingIPAddress) + vmIndex);
            instance.ipConfigurations[0].properties.privateIPAddress = updatedIp;
        }
        result.nics.push(instance);
        return result;
    }, {
        pips: [],
        nics: []
    });
}

exports.processNetworkInterfaceSettings = process;
exports.mergeWithDefaults = merge;
exports.validations = networkInterfaceValidations;
