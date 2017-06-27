'use strict';

let _ = require('lodash');
let v = require('./validation.js');
let r = require('./resources.js');

const NETWORKSECURITYGROUP_SETTINGS_DEFAULTS = [
    {
        virtualNetworks: [
            {
                subnets: []
            }
        ],
        networkInterfaces: [],
        securityRules: [],
        tags: {}
    }
];


// TODO - Should we move this to a separate file?  Do we need to allow the users to customize or add their own?
let namedSecurityRules = {
    'ActiveDirectory': [
        {
            name: 'AllowADReplication',
            protocol: '*',
            sourcePortRange: '*',
            destinationPortRange: 389,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            direction: 'Inbound',
            access: 'Allow'
        },
        {
            name: 'AllowADReplicationSSL',
            protocol: '*',
            sourcePortRange: '*',
            destinationPortRange: 636,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            direction: 'Inbound',
            access: 'Allow'
        },
        {
            name: 'AllowADGCReplication',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 3268,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        },
        {
            name: 'AllowADGCReplicationSSL',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 3269,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        },
        {
            name: 'AllowDNS',
            protocol: '*',
            sourcePortRange: '*',
            destinationPortRange: 53,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        },
        {
            name: 'AllowKerberosAuthentication',
            protocol: '*',
            sourcePortRange: '*',
            destinationPortRange: 88,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        },
        {
            name: 'AllowADReplicationTrust',
            protocol: '*',
            sourcePortRange: '*',
            destinationPortRange: 445,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        },
        {
            name: 'AllowSMTPReplication',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 25,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        },
        {
            name: 'AllowRPCReplication',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 135,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        },
        {
            name: 'AllowFileReplication',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 5722,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        },
        {
            name: 'AllowWindowsTime',
            protocol: 'UDP',
            sourcePortRange: '*',
            destinationPortRange: 123,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        },
        {
            name: 'AllowPasswordChangeKerberes',
            protocol: '*',
            sourcePortRange: '*',
            destinationPortRange: 464,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        },
        {
            name: 'AllowDFSGroupPolicy',
            protocol: 'UDP',
            sourcePortRange: '*',
            destinationPortRange: 138,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        },
        {
            name: 'AllowADDSWebServices',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 9389,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        },
        {
            name: 'AllowNETBIOSAuthentication',
            protocol: 'UDP',
            sourcePortRange: '*',
            destinationPortRange: 137,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        },
        {
            name: 'AllowNETBIOSReplication',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 139,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'FTP': [
        {
            name: 'FTP',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 21,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'SSH': [
        {
            name: 'SSH',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 22,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'SMTP': [
        {
            name: 'SMTP',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 25,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'DNS-TCP': [
        {
            name: 'DNS-TCP',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 53,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'DNS-UDP': [
        {
            name: 'DNS-UDP',
            protocol: 'UDP',
            sourcePortRange: '*',
            destinationPortRange: 53,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'HTTP': [
        {
            name: 'HTTP',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 80,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'POP3': [
        {
            name: 'POP3',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 110,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'IMAP': [
        {
            name: 'IMAP',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 143,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'LDAP': [
        {
            name: 'LDAP',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 389,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'HTTPS': [
        {
            name: 'HTTPS',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 443,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'SMTPS': [
        {
            name: 'SMTPS',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 465,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'IMAPS': [
        {
            name: 'IMAPS',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 993,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'POP3S': [
        {
            name: 'POP3S',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 995,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'MSSQL': [
        {
            name: 'MSSQL',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 1433,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'MySQL': [
        {
            name: 'MySQL',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 3306,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'RDP': [
        {
            name: 'RDP',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 3389,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'PostgreSQL': [
        {
            name: 'PostgreSQL',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 5432,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'RabbitMQ': [
        {
            name: 'RabbitMQ',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 5672,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'CouchDB': [
        {
            name: 'CouchDB',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 5984,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'WinRM': [
        {
            name: 'WinRM',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 5986,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'Redis': [
        {
            name: 'Redis',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 6379,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'CouchDB-HTTPS': [
        {
            name: 'CouchDB-HTTPS',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 6984,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'Cassandra-JMX': [
        {
            name: 'Cassandra-JMX',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 7199,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'Neo4J': [
        {
            name: 'Neo4J',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 7474,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'Riak': [
        {
            name: 'Riak',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 8093,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'Riak-JMX': [
        {
            name: 'Riak-JMX',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 8985,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'Cassandra': [
        {
            name: 'Cassandra',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 9042,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'Cassandra-Thrift': [
        {
            name: 'Cassandra-Thrift',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 9160,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'ElasticSearch': [
        {
            name :'ElasticSearch',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: '9200-9300',
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'Memcached': [
        {
            name: 'Memcached',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 11211,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'Kestrel': [
        {
            name: 'Kestrel',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 22133,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'MongoDB': [
        {
            name: 'MongoDB',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: 27017,
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ],
    'DynamicPorts': [
        {
            name: 'DynamicPorts',
            protocol: 'TCP',
            sourcePortRange: '*',
            destinationPortRange: '49152-65535',
            sourceAddressPrefix: '*',
            destinationAddressPrefix: '*',
            access: 'Allow',
            direction: 'Inbound'
        }
    ]
};

let validProtocols = ['TCP', 'UDP', '*'];
let validDefaultTags = ['VirtualNetwork', 'AzureLoadBalancer', 'Internet', '*'];
let validDirections = ['Inbound', 'Outbound'];
let validAccesses = ['Allow', 'Deny'];

let isValidProtocol = (protocol) => {
    return v.utilities.isStringInArray(protocol, validProtocols);
};

let isValidAddressPrefix = (addressPrefix) => {
    return ((v.utilities.networking.isValidIpAddress(addressPrefix)) ||
        (v.utilities.networking.isValidCidr(addressPrefix)) ||
        (v.utilities.isStringInArray(addressPrefix, validDefaultTags)));
};

let isValidDirection = (direction) => {
    return v.utilities.isStringInArray(direction, validDirections);
};

let isValidPriority = (priority) => {
    priority = _.toNumber(priority);
    return ((!_.isUndefined(priority)) && (_.isFinite(priority)) && (_.inRange(priority, 100, 4097)));
};

let isValidAccess = (access) => {
    return v.utilities.isStringInArray(access, validAccesses);
};

let networkSecurityGroupSettingsSecurityRulesValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    protocol: (value) => {
        return {
            result: isValidProtocol(value),
            message: `Valid values are ${validProtocols.join(',')}`
        };
    },
    sourcePortRange: v.validationUtilities.isValidPortRange,
    destinationPortRange: v.validationUtilities.isValidPortRange,
    sourceAddressPrefix: (value) => {
        return {
            result: isValidAddressPrefix(value),
            message: `Valid values are an IPAddress, a CIDR, or one of the following values: ${validDefaultTags.join(',')}`
        };
    },
    destinationAddressPrefix: (value) => {
        return {
            result: isValidAddressPrefix(value),
            message: `Valid values are an IPAddress, a CIDR, or one of the following values: ${validDefaultTags.join(',')}`
        };
    },
    direction: (value) => {
        return {
            result: isValidDirection(value),
            message: `Valid values are ${validDirections.join(',')}`
        };
    },
    priority: (value) => {
        return {
            result: isValidPriority(value),
            message: 'Valid value is between 100 and 4096, inclusive'
        };
    },
    access: (value) => {
        return {
            result: isValidAccess(value),
            message: `Valid values are ${validAccesses.join(',')}`
        };
    }
};

let virtualNetworkValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    subnets: (value) => {
        if ((_.isNil(value)) || (value.length === 0)) {
            return {
                result: false,
                message: 'Value cannot be null, undefined, or an empty array'
            };
        } else {
            return {
                validations: v.validationUtilities.isNotNullOrWhitespace
            };
        }
    }
};

let networkInterfaceValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace
};

let networkSecurityGroupSettingsValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    tags: v.tagsValidations,
    securityRules: (value) => {
        // We allow empty arrays
        let result = {
            result: true
        };

        if (value.length > 0) {
            // We need to validate if the array isn't empty
            result = {
                validations: networkSecurityGroupSettingsSecurityRulesValidations
            };
        }

        return result;
    },
    virtualNetworks: (value) => {
        // We allow empty arrays
        let result = {
            result: true
        };

        if (value.length > 0) {
            // We need to validate if the array isn't empty
            result = {
                validations: virtualNetworkValidations
            };
        }

        return result;
    },
    networkInterfaces: (value) => {
        // We allow empty arrays
        let result = {
            result: true
        };

        if (value.length > 0) {
            // We need to validate if the array isn't empty
            result = {
                validations: networkInterfaceValidations
            };
        }

        return result;
    }
};

function transform(settings) {
    let result = {
        name: settings.name,
        id: r.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.Network/networkSecurityGroups', settings.name),
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
        location: settings.location,
        tags: settings.tags,
        properties: {
            securityRules: _.map(settings.securityRules, (value) => {
                let result = {
                    name: value.name,
                    properties: {
                        direction: value.direction,
                        priority: value.priority,
                        sourceAddressPrefix: value.sourceAddressPrefix,
                        destinationAddressPrefix: value.destinationAddressPrefix,
                        sourcePortRange: value.sourcePortRange,
                        destinationPortRange: value.destinationPortRange,
                        access: value.access,
                        protocol: value.protocol
                    }
                };

                return result;
            })
        }
    };

    return result;
}

let merge = ({ settings, buildingBlockSettings, defaultSettings }) => {
    let defaults = (defaultSettings) ? [NETWORKSECURITYGROUP_SETTINGS_DEFAULTS, defaultSettings] : NETWORKSECURITYGROUP_SETTINGS_DEFAULTS;

    let merged = r.setupResources(settings, buildingBlockSettings, (parentKey) => {
        return ((parentKey === null) || (v.utilities.isStringInArray(parentKey, ['virtualNetworks', 'networkInterfaces'])));
    });

    // TODO - We need to calculate priorities here once we figure out how we want to accept them from the user.
    // This is mainly to support the named rules.
    merged = v.merge(merged, defaults);
    merged = _.map(merged, (value) => {
        // We need to check for named rules.  We will loop through the rules of the nsg, adding them to a new array.
        // As we encounter named rules, we will expand them and insert them in place in the resultant array.
        let expandedSecurityRules = _.transform(value.securityRules, (result, value) => {
            // We will ignore any missing or invalid fields here, since they will be caught in validations.
            let namedSecurityRule = namedSecurityRules[value.name];
            if (namedSecurityRule) {
                // If we have a named rule, we need to do a couple of things.
                // The user could have overridden one or more of the following:  sourcePortRange, sourceAddressPrefix, destinationAddressPrefix.
                // Therefore, we need to merge these settings with all of the security rules associated with the named security rule.
                // First, we will make a copy of the individual settings that could have these fields, and then merge them with the rules
                // associated with the named security rule.
                let userSettings = _.times(namedSecurityRule.length, () => {
                    return _.cloneDeep(_.pick(value, ['sourcePortRange', 'sourceAddressPrefix', 'destinationAddressPrefix']));
                });
                let mergedSecurityRules = _.merge(namedSecurityRule, userSettings);
                _.forEach(mergedSecurityRules, (value) => {
                    result.push(value);
                });
            } else {
                result.push(value);
            }

            return result;
        }, []);

        // Renumber the priorities
        expandedSecurityRules = _.map(expandedSecurityRules, (value, index) => {
            value.priority = (index * 10) + 100;
            return value;
        });
        value.securityRules = expandedSecurityRules;
        return value;
    });

    return merged;
};

function process({ settings, buildingBlockSettings, defaultSettings }) {
    if (_.isPlainObject(settings)) {
        settings = [settings];
    }

    let buildingBlockErrors = v.validate({
        settings: buildingBlockSettings,
        validations: {
            subscriptionId: v.validationUtilities.isGuid,
            resourceGroupName: v.validationUtilities.isNotNullOrWhitespace,
        }
    });

    if (buildingBlockErrors.length > 0) {
        throw new Error(JSON.stringify(buildingBlockErrors));
    }

    let results = merge({
        settings: settings,
        buildingBlockSettings: buildingBlockSettings,
        defaultSettings: defaultSettings
    });

    let errors = v.validate({
        settings: results,
        validations: networkSecurityGroupSettingsValidations
    });

    if (errors.length > 0) {
        throw new Error(JSON.stringify(errors));
    }

    results = _.transform(results, (result, setting) => {
        result.networkSecurityGroups.push(transform(setting));
        if (setting.virtualNetworks.length > 0) {
            result.subnets = result.subnets.concat(_.transform(setting.virtualNetworks, (result, virtualNetwork) => {
                _.each(virtualNetwork.subnets, (subnet) => {
                    result.push({
                        id: r.resourceId(virtualNetwork.subscriptionId, virtualNetwork.resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets',
                            virtualNetwork.name, subnet),
                        subscriptionId: virtualNetwork.subscriptionId,
                        resourceGroupName: virtualNetwork.resourceGroupName,
                        virtualNetwork: virtualNetwork.name,
                        name: subnet,
                        properties: {
                            networkSecurityGroup: {
                                id: r.resourceId(setting.subscriptionId, setting.resourceGroupName, 'Microsoft.Network/networkSecurityGroups', setting.name),
                            }
                        }
                    });
                });
            }, []));
        }

        if (setting.networkInterfaces.length > 0) {
            result.networkInterfaces = result.networkInterfaces.concat(_.transform(setting.networkInterfaces, (result, networkInterface) => {
                result.push({
                    id: r.resourceId(networkInterface.subscriptionId, networkInterface.resourceGroupName, 'Microsoft.Network/networkInterfaces',
                        networkInterface.name),
                    subscriptionId: networkInterface.subscriptionId,
                    resourceGroupName: networkInterface.resourceGroupName,
                    name: networkInterface.name,
                    properties: {
                        networkSecurityGroup: {
                            id: r.resourceId(setting.subscriptionId, setting.resourceGroupName, 'Microsoft.Network/networkSecurityGroups', setting.name),
                        }
                    }
                });
            }, []));
        }
    }, {
        networkSecurityGroups: [],
        subnets: [],
        networkInterfaces: []
    });

    // Get needed resource groups information.
    let resourceGroups = r.extractResourceGroups(results.networkSecurityGroups);
    return {
        resourceGroups: resourceGroups,
        parameters: results
    };
}

exports.process = process;
