'use strict';

let commander = require('commander');
let fs = require('fs');
let path = require('path');
let _ = require('lodash');
let v = require('./core/validation.js');
const os = require('os');
const az = require('./azCLI.js');

let parseParameterFile = ({parameterFile}) => {
    // Resolve the path to be cross-platform safe
    parameterFile = path.resolve(parameterFile);
    let exists = fs.existsSync(parameterFile);
    if (!exists) {
        throw new Error(`parameters file '${commander.parametersFile}' does not exist`);
    }

    let content = fs.readFileSync(parameterFile, 'UTF-8');

    try {
        return JSON.parse(content.replace(/^\uFEFF/, '')).parameters;
    } catch (e) {
        throw new Error(`parameter file '${commander.parametersFile}' is not well-formed: ${e.message}`);
    }
};

let processParameters = ({buildingBlock, parameters, buildingBlockSettings, defaultsDirectory}) => {
    let processor = buildingBlock;

    let parameter = parameters[processor.parameterName];
    if (!parameter) {
        throw new Error(`parameter '${processor.parameterName}' not found.`);
    }

    let defaults;
    if (defaultsDirectory) {
        // Grab defaults, if they exist
        let defaultsFile = path.join(defaultsDirectory, `${processor.parameterName}.json`);
        if (fs.existsSync(defaultsFile)) {
            try {
                let content = fs.readFileSync(defaultsFile, 'UTF-8');
                defaults = JSON.parse(content.replace(/^\uFEFF/, ''));
            } catch (e) {
                throw new Error(`error parsing '${defaultsFile}': ${e.message}`);
            }
        }
    }

    let results = processor.process({
        settings: parameter,
        buildingBlockSettings: buildingBlockSettings,
        defaultSettings: defaults
    });

    // Verify that any one resource group does not have multiple locations.
    // If this is the case, we can't know which one to use to create the resource group.
    // There is also a check for more than one subscription id (i.e. not the one in the building block settings).
    // If cross subscription deployments are ever implemented, remove this check.
    let groupedResourceGroups = _.map(_.uniqWith(_.map(results.resourceGroups, (value) => {
        return {
            subscriptionId: value.subscriptionId,
            resourceGroupName: value.resourceGroupName
        };
    }), _.isEqual), (value) => {
        value.locations = _.map(_.filter(results.resourceGroups, (rg) => {
            return ((rg.subscriptionId === value.subscriptionId) && (rg.resourceGroupName === value.resourceGroupName));
        }), (value) => {
            return value.location;
        });

        return value;
    });

    let invalidResourceGroups = _.filter(groupedResourceGroups, (value) => {
        return value.locations.length > 1;
    });

    if (invalidResourceGroups.length > 0) {
        let message = 'Resource groups for created resources can only be in one location';
        _.forEach(invalidResourceGroups, (value) => {
            message = message.concat(
                `${os.EOL}    subscriptionId: '${value.subscriptionId}' resourceGroup: '${value.resourceGroupName}' locations: '${value.locations.join(',')}'`);
        });
        throw new Error(message);
    }

    let invalidSubscriptions = _.filter(_.uniq(_.map(groupedResourceGroups, (value) => {
        return value.subscriptionId;
    })), (value) => {
        return value !== buildingBlockSettings.subscriptionId;
    });

    if (invalidSubscriptions.length > 0) {
        let message = 'Resource groups for created resources can only be in the deployment subscription';
        _.forEach(invalidSubscriptions, (value) => {
            message = message.concat(
                `${os.EOL}    invalid subscriptionId: '${value}'`);
        });
        throw new Error(message);
    }

    return results;
};

let getBuildingBlocks = ({baseUri}) => {
    if (_.isNil(baseUri)) {
        baseUri = 'https://raw.githubusercontent.com/mspnp/template-building-blocks/roshar/spikes/spikes/nodejs-spike/templates/';
    }

    // Clean the baseUri just in case it ends with /
    baseUri = _.trimEnd(baseUri, '/');

    return {
        vm: {
            process: require(path.resolve('./core', 'virtualMachineSettings.js')).process,
            parameterName: 'virtualMachineSettings',
            template: _.join([baseUri, 'buildingBlocks/virtualMachines/virtualMachines.json'], '/')
        },
        nsg: {
            process: require(path.resolve('./core', 'networkSecurityGroupSettings.js')).process,
            parameterName: 'networkSecurityGroupSettings',
            template: _.join([baseUri, 'buildingBlocks/networkSecurityGroups/networkSecurityGroups.json'], '/')
        },
        'route-table': {
            process: require(path.resolve('./core', 'routeTableSettings.js')).process,
            parameterName: 'routeTableSettings',
            template: _.join([baseUri, 'buildingBlocks/routeTables/routeTables.json'], '/')
        },
        'vm-extension': {
            process: ({settings, buildingBlockSettings}) => {
                let process = require(path.resolve('./core', 'virtualMachineExtensionsSettings.js')).process;
                return process(settings, buildingBlockSettings);
            },
            parameterName: 'virtualMachinesExtensionSettings',
            template: _.join([baseUri, 'buildingBlocks/virtualMachineExtensions/virtualMachineExtensions.json'], '/')
        },
        vnet: {
            process: require(path.resolve('./core', 'virtualNetworkSettings.js')).process,
            parameterName: 'virtualNetworkSettings',
            template: _.join([baseUri, 'buildingBlocks/virtualNetworks/virtualNetworks.json'], '/')
        },
        'vnet-gateway': {
            process: require(path.resolve('./core', 'virtualNetworkGatewaySettings.js')).process,
            parameterName: 'virtualNetworkGatewaySettings',
            template: _.join([baseUri, 'buildingBlocks/virtualNetworkGateways/virtualNetworkGateways.json'], '/')
        },
        'vpn-connection': {
            process: require(path.resolve('./core', 'connectionSettings.js')).process,
            parameterName: 'connectionSettings',
            template: _.join([baseUri, 'buildingBlocks/connections/connections.json'], '/')
        }
    };
};

let createTemplateParameters = ({parameters}) => {
    let templateParameters = {
        $schema: 'http://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#',
        contentVersion: '1.0.0.0',
        parameters: _.transform(parameters, (result, value, key) => {
            // All KeyVault parameters are named secret.  We need to see if it's a value, or if it is a KeyVault reference.
            if (key === 'secret') {
                if (_.isUndefined(value.reference)) {
                    result[key] = {
                        value: value
                    };
                } else {
                    result[key] = value;
                }
            } else {
                result[key] = {
                    value: value
                };
            }

            return result;
        }, {})
    };

    return templateParameters;
};

let validateSubscriptionId = (value) => {
    if (!v.utilities.isGuid(value)) {
        throw new Error(`invalid subscription-id '${value}'`);
    }

    return value;
};

let createResourceGroups = ({resourceGroups}) => {
    // We need to group them in an efficient way for the CLI
    resourceGroups = _.groupBy(resourceGroups, (value) => {
        return value.subscriptionId;
    });

    _.forOwn(resourceGroups, (value, key) => {
        // Set the subscription for the tooling so we can create the resource groups in the right subscription
        az.setSubscription({
            subscriptionId: key
        });
        _.forEach(value, (value) => {
            az.createResourceGroupIfNotExists({
                resourceGroupName: value.resourceGroupName,
                location: value.location
            });
            //console.log(`createResourceGroupIfNotExists: ${value.resourceGroupName} ${value.location}`);
        });
    });
};

let deployTemplate = ({parameterFile, buildingBlockSettings, buildingBlock, buildingBlockName}) => {
    let buildingBlockMetadata = buildingBlock;

    // Get the current date in UTC and remove the separators.  We can use this as our deployment name.
    let deploymentName = `${buildingBlockName}-${new Date().toISOString().replace(/[T\:\.\Z-]/g, '')}`;

    az.setSubscription({
        subscriptionId: buildingBlockSettings.subscriptionId
    });

    az.createResourceGroupIfNotExists({
        location: buildingBlockSettings.location,
        resourceGroupName: buildingBlockSettings.resourceGroupName,
    });

    // In case we have a SAS token, we need to append it to the template uri.  It will be passed into the building block in
    // the buildingBlockSettings objects as well.
    let templateUri = buildingBlockMetadata.template.concat(buildingBlockSettings.sasToken);
    az.deployTemplate({
        deploymentName: deploymentName,
        resourceGroupName: buildingBlockSettings.resourceGroupName,
        templateUri: templateUri,
        parameterFile: parameterFile
    });
};

let cloudName = 'AzureCloud';

try {
    commander
        .version('0.0.1')
        .option('-b, --building-block <building-block>', 'the building block to execute')
        .option('-g, --resource-group <resource-group>', 'the name of the resource group')
        .option('-p, --parameters-file <parameters-file>', 'the path to a parameters file')
        .option('-o, --output-file <output-file>', 'the output file name')
        .option('-s, --subscription-id <subscription-id>', 'the subscription identifier', validateSubscriptionId)
        .option('-l, --location <location>', 'location in which to create the resource group, if it does not exist')
        .option('-d, --defaults-directory <defaults-directory>', 'directory containing customized building block default values')
        .option('--json', 'output JSON to console')
        .option('--deploy', 'deploy building block using az')
        .option('-t, --template-base-uri <template-base-uri>', 'base uri of building block tempaltes')
        .option('-k, --sas-token <sas-token>', 'sas token to pass to the template-base-uri')
        .option('-c, --cloud, <cloud>', 'registered az cloud to use')
        .parse(process.argv);

    if (_.isUndefined(commander.buildingBlock)) {
        throw new Error('no building block specified');
    }

    if (_.isUndefined(commander.resourceGroup)) {
        throw new Error('no resource group specified');
    }

    if (_.isUndefined(commander.subscriptionId)) {
        throw new Error('no subscription id specified');
    }
    if (((_.isUndefined(commander.outputFile)) && (_.isUndefined(commander.json))) ||
        ((!_.isUndefined(commander.outputFile)) && (!_.isUndefined(commander.json)))) {
        // Either both output types are not specified, or both of them were.  It's still invalid!
        throw new Error('either --output-file or --json must be specified, but not both');
    } else if (!_.isUndefined(commander.outputFile)) {
        // File output was specified.
        commander.outputFile = path.resolve(commander.outputFile);
    }

    if (!_.isUndefined(commander.defaultsDirectory)) {
        commander.defaultsDirectory = path.resolve(commander.defaultsDirectory);
        if (!fs.existsSync(commander.defaultsDirectory)) {
            throw new Error(`defaults path '${commander.defaultsDirectory}' was not found`);
        }
    }

    if (!_.isUndefined(commander.cloud)) {
        cloudName = commander.cloud;
    }

    let registeredClouds = az.getRegisteredClouds();

    let cloud = _.find(registeredClouds, (value) => {
        return value.name === cloudName;
    });

    if (_.isUndefined(cloud)) {
        throw new Error(`cloud '${cloudName}' not found`);
    }

    let buildingBlocks = getBuildingBlocks({
        baseUri: commander.templateBaseUri
    });

    let buildingBlock = buildingBlocks[commander.buildingBlock];
    
    if (!buildingBlock) {
        throw new Error(`building block '${commander.buildingBlock}' not found.`);
    }

    if (commander.deploy === true) {
        if (_.isUndefined(commander.location)) {
            throw new Error('--deploy was specified, but no location was specified');
        }

        if (commander.json === true) {
            throw new Error('--deploy cannot be specified with --json');
        }
    }

    let parameters = parseParameterFile({
        parameterFile: commander.parametersFile
    });

    let buildingBlockSettings = {
        subscriptionId: commander.subscriptionId,
        resourceGroupName: commander.resourceGroup,
        location: (commander.location ? commander.location : ''),
        cloud: cloud,
        sasToken: (commander.sasToken ? '?'.concat(commander.sasToken) : '')
    };

    let result = processParameters({
        buildingBlock: buildingBlock,
        parameters: parameters,
        buildingBlockSettings: buildingBlockSettings,
        defaultsDirectory: commander.defaultsDirectory
    });

    let templateParameters = createTemplateParameters({
        parameters: result.parameters
    });

    // Prettify the json just in case we want to inspect the file.
    let output = JSON.stringify(templateParameters, null, 2);
    if (commander.json === true) {
        console.log(output);
    } else {
        fs.writeFileSync(commander.outputFile, output);
        console.log();
        console.log(`  parameters written to ${commander.outputFile}`);
        console.log();

        if (commander.deploy === true) {
            // Get the resources groups to create if they don't exist.  Each block is responsible for specifying these.
            createResourceGroups({
                resourceGroups: result.resourceGroups
            });
            deployTemplate({
                parameterFile: commander.outputFile,
                buildingBlockSettings: buildingBlockSettings,
                buildingBlock: buildingBlock,
                buildingBlockName: commander.buildingBlock
            });
        }
    }
} catch (e) {
    console.error();
    console.error(`  error: ${e.message}`);
    console.error();
    process.exit(1);
}
