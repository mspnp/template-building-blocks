#!/usr/bin/env node
'use strict';

const commander = require('commander');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const v = require('./core/validation');
const os = require('os');
const az = require('./azCLI');
const semver = require('semver');


const AZBB_VERSION = '2.2.4';

let getDefaultOptions = () => {
    let defaultOptions = {
        cloudName: 'AzureCloud',
        outputFormat: 'files',
        deploy: false,
        // This will allow us to tolerate template changes using tags
        templateBaseUri: semver.satisfies(AZBB_VERSION, '>=2.0.0 <2.1.0') ? 'https://raw.githubusercontent.com/mspnp/template-building-blocks/v2.0.0/templates' :
            semver.satisfies(AZBB_VERSION, '>=2.1.0 <2.1.12') ? 'https://raw.githubusercontent.com/mspnp/template-building-blocks/v2.1.0/templates' :
            semver.satisfies(AZBB_VERSION, '>=2.2.0') ? 'https://raw.githubusercontent.com/mspnp/template-building-blocks/v2.2.0/templates' : null
    };

    if (!defaultOptions.templateBaseUri) {
        throw new Error(`templateBaseUri not found for version: ${AZBB_VERSION}`);
    }

    return defaultOptions;
};

let padInteger = (number, mask) => {
    if ((!_.isSafeInteger(number)) || (number < 0)) {
        throw new Error('number be a positive integer');
    }

    if (!_.isString(mask)) {
        throw new Error('mask must be a string');
    }
    let numberString = number.toString();
    return (mask.concat(numberString)).slice(-Math.max(mask.length, numberString.length));
};

let parseParameterFile = ({parameterFile}) => {
    // Resolve the path to be cross-platform safe
    parameterFile = path.resolve(parameterFile);
    let exists = fs.existsSync(parameterFile);
    if (!exists) {
        throw new Error(`parameters file '${parameterFile}' does not exist`);
    }

    let content = fs.readFileSync(parameterFile, 'UTF-8');

    try {
        let json = JSON.parse(content.replace(/^\uFEFF/, ''));
        let parameters = json.parameters;
        return parameters;
    } catch (e) {
        throw new Error(`parameter file '${parameterFile}' is not well-formed: ${e.message}`);
    }
};

let processParameters = ({buildingBlock, parameters, buildingBlockSettings, defaultsDirectory}) => {
    let processor = buildingBlock;

    let defaults;
    if (defaultsDirectory) {
        // Grab defaults, if they exist
        let defaultsFile = path.join(defaultsDirectory, `${processor.defaultsFilename}`);
        if (fs.existsSync(defaultsFile)) {
            try {
                let content = fs.readFileSync(defaultsFile, 'UTF-8');
                defaults = JSON.parse(content.replace(/^\uFEFF/, ''));
            } catch (e) {
                throw new Error(`error parsing '${defaultsFile}': ${e.message}`);
            }
        }
    }

    // Call preProcess if it exists.
    if (processor.preProcess) {
        let copy = _.cloneDeep(parameters);
        parameters = processor.preProcess(copy, buildingBlockSettings);
    }

    let results = processor.process({
        settings: parameters,
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

    return results;
};

let getBuildingBlocks = ({baseUri, additionalBuildingBlocks = []}) => {
    // We may need to support multiple additional building blocks, so we'll squash everything together here.
    // After the command line parsing, additionalBuildingBlocks will be an array, so we'll just put the default blocks
    // first.
    let buildingBlockModules = ['./buildingBlocks'];
    if (additionalBuildingBlocks.length > 0) {
        buildingBlockModules = buildingBlockModules.concat(additionalBuildingBlocks);
    }

    // Load all of the building blocks
    let buildingBlocks = _.reduce(buildingBlockModules, (result, value) => {
        let getBuildingBlocks = require(value).getBuildingBlocks;
        if (!getBuildingBlocks) {
            throw new Error(`'${value}' is not a valid building block module`);
        }

        result = result.concat(getBuildingBlocks({
            application: module,
            baseUri: baseUri
        }));

        return result;
    }, []);

    // Validate building blocks.
    // Make sure type and defaultsFilename aren't duplicated
    let duplicates = _.transform(_.groupBy(buildingBlocks, (value) => {
        return value.type;
    }), (result, value, key) => {
        if (value.length > 1) {
            result.push(key);
        }

        return result;
    }, []);

    if (duplicates.length > 0) {
        throw new Error(`Duplicate building block types found: ${duplicates.join(',')}`);
    }

    duplicates = _.transform(_.groupBy(buildingBlocks, (value) => {
        return value.defaultsFilename;
    }), (result, value, key) => {
        if (value.length > 1) {
            result.push(key);
        }

        return result;
    }, []);

    if (duplicates.length > 0) {
        throw new Error(`Duplicate building block default filenames found: ${duplicates.join(',')}`);
    }

    return buildingBlocks;
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

let validOutputFormats = ['json', 'files'];

let isValidOutputFormat = (value) => {
    return v.utilities.isStringInArray(value, validOutputFormats);
};

const generateBashDeploymentScript = ({deploymentResourceGroup, processedBuildingBlocks}) => {
    // For script generation, we will be a little different.  We will create all needed resource groups
    // at the start.  That way, the script looks cleaner. :)
    // Make sure we add the resource group that was specified on the command line.
    let resourceGroups = _.uniqWith(
        _.flatten(
            [deploymentResourceGroup].concat(processedBuildingBlocks.map(r => r.resourceGroups))
        ),
        _.isEqual
    );
    const lines = [
        '#!/bin/bash',
        'set -e ',
        'set -o pipefail',
        'OUTPUT_FILENAME="$(basename -s .sh "$BASH_SOURCE")-output.json"',
        '',
        `RG_NAMES=(${resourceGroups.map(t => `'${t.resourceGroupName}'`).join(' ')})`,
        `RG_LOCATIONS=(${resourceGroups.map(t => `'${t.location}'`).join(' ')})`,
        `RG_SUBSCRIPTIONS=(${resourceGroups.map(t => `'${t.subscriptionId}'`).join(' ')})`,
        'for (( i = 0; i < ${#RG_NAMES[@]}; ++i )); do',
        '        GROUP_EXISTS=$(az group exists --name "${RG_NAMES[i]}" --subscription "${RG_SUBSCRIPTIONS[i]}")',
        '        if ( $GROUP_EXISTS ); then',
        '                echo "Resource group \'${RG_NAMES[i]}\' already exists"',
        '        else',
        '                echo "Creating resource group \'${RG_NAMES[i]}\'"',
        '                AZ_OUTPUT+="$(az group create --name ${RG_NAMES[i]} --location ${RG_LOCATIONS[i]} --subscription ${RG_SUBSCRIPTIONS[i]}),"',
        '        fi',
        'done',
        ''
    ].concat(_.flatMap(processedBuildingBlocks, (processedBuildingBlock, index) => {
        const args = {
            "name": processedBuildingBlock.deploymentName,
            "subscription": processedBuildingBlock.buildingBlockSettings.subscriptionId,
            "resource-group": processedBuildingBlock.buildingBlockSettings.resourceGroupName,
            "template-uri": processedBuildingBlock.buildingBlock.template.concat(processedBuildingBlock.buildingBlockSettings.sasToken)
        };

        return [
            `echo "Executing deployment '${processedBuildingBlock.deploymentName}'"`,
            `AZ_OUTPUT+="$(az group deployment create ${Object.keys(args).map(key => `--${key} '${args[key]}'`).join(' ')} --parameters @'${path.basename(processedBuildingBlock.outputFilename)}'),"`
        ];
    })).concat(
        [
            'echo "[${AZ_OUTPUT:0:-1}]" > $OUTPUT_FILENAME',
            'echo "Deployment outputs written to \'$OUTPUT_FILENAME\'"',
            ''
        ]
    );
    
    let script = lines.join('\n');
    return script;
};

const generatePowershellDeploymentScript = ({deploymentResourceGroup, processedBuildingBlocks}) => {
    // For script generation, we will be a little different.  We will create all needed resource groups
    // at the start.  That way, the script looks cleaner. :)
    // Make sure we add the resource group that was specified on the command line.
    let resourceGroups = _.uniqWith(
        _.flatten(
            [deploymentResourceGroup].concat(processedBuildingBlocks.map(r => r.resourceGroups))
        ),
        _.isEqual
    );
    const lines = [
        '$ErrorActionPreference = "Stop"',
        '$InformationPreference = "Continue"',
        '',
        'function Create-ResourceGroup {',
        '    param(',
        '        [string]$SubscriptionId,',
        '        [string]$ResourceGroupName,',
        '        [string]$Location',
        '    )',
        '',
        '    Set-AzContext -SubscriptionId $SubscriptionId | Out-Null',
        '    $resourceGroup = Get-AzResourceGroup -Name $ResourceGroupName -ErrorAction SilentlyContinue',
        '    if ($null -ne $resourceGroup) {',
        '        Write-Information "Resource group \'$($ResourceGroupName)\' already exists"',
        '    } else {',
        '        Write-Information "Creating resource group \'$($ResourceGroupName)\'"',
        '        $DebugPreference = "Continue"',
        '        $output = New-AzResourceGroup -Name $ResourceGroupName -Location $Location 5>&1',
        '        $DebugPreference = "SilentlyContinue"',
        '        $lines = -join $($output | ForEach-Object {$_.Message})',
        '        $regex = "(?:=+\\sHTTP\\sRESPONSE\\s=+.*Body\\:)(.*)(?:AzureQoSEvent\\: CommandName - New-AzResourceGroup)"',
        '        $match = [System.Text.RegularExpressions.Regex]::Match($lines, $regex, `',
        '            [System.Text.RegularExpressions.RegexOptions]::Singleline)',
        '        $match.Groups[1].Captures[0].Value',
        '    }',
        '}',
        '',
        'function Deploy-BuildingBlock {',
        '    param(',
        '        [string]$DeploymentName,',
        '        [string]$SubscriptionId,',
        '        [string]$ResourceGroupName,',
        '        [string]$TemplateUri,',
        '        [string]$TemplateParameterFile',
        '    )',
        '',
        '    Set-AzContext -SubscriptionId $SubscriptionId | Out-Null',
        '    $DebugPreference = "Continue"',
        '    $output = New-AzResourceGroupDeployment -Name $DeploymentName -ResourceGroupName $ResourceGroupName `',
        '        -TemplateUri $TemplateUri -TemplateParameterFile $TemplateParameterFile 5>&1',
        '    $DebugPreference = "SilentlyContinue"',
        '    $lines = -join $($output | ForEach-Object {$_.Message})',
        '    $regex = "(?:=+\\sHTTP\\sRESPONSE\\s=+.*Body\\:)(.*)(?:AzureQoSEvent\\: CommandName - New-AzResourceGroupDeployment)"',
        '    $match = [System.Text.RegularExpressions.Regex]::Match($lines, $regex, `',
        '        [System.Text.RegularExpressions.RegexOptions]::Singleline)',
        '    $match.Groups[1].Captures[0].Value',
        '}',
        '',
        '$OUTPUT_FILENAME = Join-Path -Path $PSScriptRoot `',
        '    -ChildPath "$([System.IO.Path]::GetFileNameWithoutExtension($PSCommandPath))-output.json"',
        '',
        '$resourceGroups = @"',
        JSON.stringify(resourceGroups, null, 4),
        //'[',
        //     {
        //         "subscriptionId": "3b518fac-e5c8-4f59-8ed5-d70b626f8e10",
        //         "resourceGroupName": "ntier-linux-rg2",
        //         "location": "westus2"
        //     },
        //     {
        //         "subscriptionId": "3b518fac-e5c8-4f59-8ed5-d70b626f8e10",
        //         "resourceGroupName": "ntier-linux-rg3",
        //         "location": "westus"
        //     },
        //     {
        //         "subscriptionId": "3b518fac-e5c8-4f59-8ed5-d70b626f8e10",
        //         "resourceGroupName": "ntier-linux-rg4",
        //         "location": "westus"
        //     }
        // ]
        '"@ | ConvertFrom-Json',
        '',
        '$AZ_OUTPUT = @()',
        '$AZ_OUTPUT += $resourceGroups | ForEach-Object {',
        '    $result = Create-ResourceGroup -SubscriptionId $_.subscriptionId -ResourceGroupName $_.resourceGroupName `',
        '        -Location $_.location',
        '    if ($null -ne $result) {',
        '        $AZ_OUTPUT += $result',
        '    }',
        '}',
        ''
    ].concat(_.flatMap(processedBuildingBlocks, (processedBuildingBlock, index) => {
        const args = {
            "DeploymentName": processedBuildingBlock.deploymentName,
            "SubscriptionId": processedBuildingBlock.buildingBlockSettings.subscriptionId,
            "ResourceGroupName": processedBuildingBlock.buildingBlockSettings.resourceGroupName,
            "TemplateUri": processedBuildingBlock.buildingBlock.template.concat(processedBuildingBlock.buildingBlockSettings.sasToken),
            "TemplateParameterFile": path.basename(processedBuildingBlock.outputFilename)
        };

        return [
            `Write-Information "Executing deployment '${processedBuildingBlock.deploymentName}'"`,
            `$AZ_OUTPUT += $(Deploy-BuildingBlock ${Object.keys(args).map(key => `-${key} "${args[key]}"`).join(' ')})`
        ];
    }))
    .concat(
        [
            '$AZ_OUTPUT = $($AZ_OUTPUT | ForEach-Object { $_.Trim() }) -join ",$([System.Environment]::NewLine)"',
            'Set-Content -Path $OUTPUT_FILENAME -Value "[$([System.Environment]::NewLine)$AZ_OUTPUT$([System.Environment]::NewLine)]"',
            'Write-Information "Deployment outputs written to \'$OUTPUT_FILENAME\'"',
            ''
        ]
    );
    
    let script = lines.join('\r\n');
    return script;
};

const generateDeploymentScripts = ({defaultBuildingBlockSettings, processedBuildingBlocks, options}) => {
    // We'll just do bash for now
    const bashScript = generateBashDeploymentScript({
        deploymentResourceGroup: {
            subscriptionId: defaultBuildingBlockSettings.subscriptionId,
            resourceGroupName: defaultBuildingBlockSettings.resourceGroupName,
            location: defaultBuildingBlockSettings.location
        },
        processedBuildingBlocks
    });
    const bashScriptFilename = path.format({
        dir: options.outputDirectory,
        name: `${options.outputBaseFilename.replace('-output', '')}-script`,
        ext: '.sh'
    });
    fs.writeFileSync(bashScriptFilename, bashScript);

    // Attempt to set execute permissions, but silently fail if it is not successful.
    try {
        fs.chmodSync(bashScriptFilename, 0o777);
    } catch(err) {
    }

    // PowerShell
    const powershellScript = generatePowershellDeploymentScript({
        deploymentResourceGroup: {
            subscriptionId: defaultBuildingBlockSettings.subscriptionId,
            resourceGroupName: defaultBuildingBlockSettings.resourceGroupName,
            location: defaultBuildingBlockSettings.location
        },
        processedBuildingBlocks
    });
    const powershellScriptFilename = path.format({
        dir: options.outputDirectory,
        name: `${options.outputBaseFilename.replace('-output', '')}-script`,
        ext: '.ps1'
    });
    fs.writeFileSync(powershellScriptFilename, powershellScript);
};

let createResourceGroups = ({resourceGroups, azOptions}) => {
    // We need to group them in an efficient way for the CLI
    resourceGroups = _.groupBy(resourceGroups, (value) => {
        return value.subscriptionId;
    });

    _.forOwn(resourceGroups, (value, key) => {
        _.forEach(value, (value) => {
            az.createResourceGroupIfNotExists({
                subscriptionId: key,
                resourceGroupName: value.resourceGroupName,
                location: value.location,
                azOptions: azOptions
            });
        });
    });
};

let deployTemplate = ({processedBuildingBlock, azOptions}) => {
    // Get the current date in UTC and remove the separators.  We can use this as our deployment name.
    az.createResourceGroupIfNotExists({
        subscriptionId: processedBuildingBlock.buildingBlockSettings.subscriptionId,
        location: processedBuildingBlock.buildingBlockSettings.location,
        resourceGroupName: processedBuildingBlock.buildingBlockSettings.resourceGroupName,
        azOptions: azOptions
    });

    // In case we have a SAS token, we need to append it to the template uri.  It will be passed into the building block in
    // the buildingBlockSettings objects as well.
    let templateUri = processedBuildingBlock.buildingBlock.template.concat(processedBuildingBlock.buildingBlockSettings.sasToken);
    az.deployTemplate({
        deploymentName: processedBuildingBlock.deploymentName,
        subscriptionId: processedBuildingBlock.buildingBlockSettings.subscriptionId,
        resourceGroupName: processedBuildingBlock.buildingBlockSettings.resourceGroupName,
        templateUri: templateUri,
        parameterFile: processedBuildingBlock.outputFilename,
        azOptions: azOptions
    });
};

let getCloud = ({name, subscriptionId}) => {
    let registeredClouds = az.getRegisteredClouds({subscriptionId});

    let cloud = _.find(registeredClouds, (value) => {
        return value.name === name;
    });

    if (_.isUndefined(cloud)) {
        throw new Error(`cloud '${name}' not found`);
    }

    return cloud;
};

let validateCommandLine = ({commander}) => {
    let options = _.cloneDeep(getDefaultOptions());

    if (_.isUndefined(commander.parametersFile)) {
        throw new Error('no parameters file specified');
    } else {
        let parametersFile = path.resolve(commander.parametersFile);
        if (!fs.existsSync(parametersFile)) {
            throw new Error(`parameters file '${parametersFile}' does not exist`);
        }

        options.parametersFile = parametersFile;
    }

    // The base uri can't end in / for blob storage, so we'll clean both here, just in case
    options.templateBaseUri = _.trimEnd(_.isUndefined(commander.templateBaseUri) ? options.templateBaseUri : commander.templateBaseUri, '/');

    if (!_.isUndefined(commander.outputFormat)) {
        options.outputFormat = commander.outputFormat;
    }

    if (commander.deploy === true) {
        options.deploy = true;
    }

    options.azOptions = {
        debug: commander.debug === true
    };

    if (!_.isUndefined(commander.subscriptionId)) {
        options.subscriptionId = commander.subscriptionId;
    }

    if (!_.isUndefined(commander.resourceGroup)) {
        options.resourceGroup = commander.resourceGroup;
    }

    if (!_.isUndefined(commander.location)) {
        options.location = commander.location;
    }

    if (!az.isValidLocation({
        subscriptionId: options.subscriptionId,
        location: options.location
        })) {
        throw new Error(`invalid location '${options.location}' for subscriptionId '${options.subscriptionId}'`);
    }

    options.sasToken = _.isUndefined(commander.sasToken) ? '' : '?'.concat(commander.sasToken);

    // If cloud is specified, override the default.
    if (!_.isUndefined(commander.cloud)) {
        options.cloudName = commander.cloud;
    }

    options.cloud = getCloud({
        name: options.cloudName,
        subscriptionId: options.subscriptionId,
        azOptions: options.azOptions
    });

    // We have the cloud now, so we need to remove the name since it's in the cloud object.  This is for consistency reasons so we always use the cloud property.
    delete options.cloudName;

    if (!_.isUndefined(commander.buildingBlocks)) {
        // This can be a semicolon separated set of files, we we need to resolve them all
        let additionalBuildingBlocks = _.map(commander.buildingBlocks.split(';'), (value) => {
            return path.resolve(value);
        });
        options.additionalBuildingBlocks = additionalBuildingBlocks;
    }

    if (!_.isUndefined(commander.defaultsDirectory)) {
        let defaultsDirectory = path.resolve(commander.defaultsDirectory);
        if (!fs.existsSync(defaultsDirectory)) {
            throw new Error(`defaults path '${defaultsDirectory}' was not found`);
        }

        options.defaultsDirectory = defaultsDirectory;
    }

    // Calculate "defaults"
    let outputFile = _.isUndefined(commander.outputFile) ? commander.parametersFile : path.resolve(commander.outputFile);
    options.outputBaseFilename = `${path.basename(outputFile, path.extname(outputFile))}-output`;
    options.outputDirectory = _.isUndefined(commander.outputFile) ? process.cwd() : path.dirname(outputFile);

    // Validate values
    if (!isValidOutputFormat(options.outputFormat)) {
        throw new Error(`output must be one of the following values: ${validOutputFormats.join(',')}`);
    }

    // Validate combinations
    if (options.outputFormat === 'json') {
        if (options.deploy === true) {
            throw new Error('--deploy cannot be used with the json output format');
        }

        // To make the interface easier, let's default a few things rather than making them explicit.
        // 1.  If neither json or outputFile is specified, assume output file is the intent, and default
        //     the outputFilename to be based on the parameter filename
        // 2.  If json is specified, no output filename is required. (We will still calculate a default, but we won't use it)
        // 3.  If outputFile is specified, we use that filename as the basis for our output filename
        // 4.  If both are specified, we'll just throw
        if (!_.isUndefined(commander.outputFile)) {
            throw new Error('json output format cannot be used with --output-file');
        }
    }

    return options;
};

let generateDefaultBuildingBlockSettings = ({options, parameters}) => {
    if (!_.has(parameters, 'buildingBlocks.value')) {
        throw new Error('parameters.buildingBlocks.value was not found');
    }

    // We need to validate that the subscriptionId, resourceGroupName, and location are not set as parameters if they have
    // already been specified on the command line
    if (((_.isUndefined(options.subscriptionId)) && (!_.has(parameters, 'subscriptionId.value'))) ||
        ((!_.isUndefined(options.subscriptionId)) && (_.has(parameters, 'subscriptionId.value')))) {
        throw new Error('subscriptionId was must be specified on the command line or must be set as a parameter, but not both');
    }

    if (((_.isUndefined(options.resourceGroup)) && (!_.has(parameters, 'resourceGroupName.value'))) ||
        ((!_.isUndefined(options.resourceGroup)) && (_.has(parameters, 'resourceGroupName.value')))) {
        throw new Error('resourceGroupName was must be specified on the command line or must be set as a parameter, but not both');
    }

    if (((_.isUndefined(options.location)) && (!_.has(parameters, 'location.value'))) ||
        ((!_.isUndefined(options.location)) && (_.has(parameters, 'location.value')))) {
        throw new Error('location was must be specified on the command line or must be set as a parameter, but not both');
    }

    return {
        subscriptionId: options.subscriptionId ? options.subscriptionId : parameters.subscriptionId.value,
        resourceGroupName: options.resourceGroup ? options.resourceGroup : parameters.resourceGroupName.value,
        location: options.location ? options.location : parameters.location.value,
        cloud: options.cloud,
        sasToken: options.sasToken
    };
};

try {
    let description = [
        '           _     _     ',
        '            | |   | |    ',
        '    __ _ ___| |__ | |__  ',
        '   / _` |_  / \'_ \\| \'_ \\ ',
        '  | (_| |/ /| |_) | |_) |',
        '   \\__,_/___|_.__/|_.__/ ',
        '',
        '  A tool for deploying Azure infrastructure based on proven practices.',
        '',
        '  Important: The Azure Building Blocks project will not be undergoing',
        '  further development.  For advanced deployment template capabilities',
        '  refer to Bicep(http://aka.ms/bicep), Azure Resource Manager template',
        '  specs(http://aka.ms/templatespecs) and the Azure Resource Manager',
        '  template documentation(https://aka.ms/arm-template-docs). New',
        '  development should not leverage Azure Building Blocks.'
    ];

    commander
        .name('azbb')
        .description(description.join('\n'))
        .version(AZBB_VERSION)
        .option('-s, --subscription-id <subscription-id>', 'Azure subscription id', validateSubscriptionId)
        .option('-l, --location <location>', 'Azure region in which to create the resource group')
        .option('-g, --resource-group <resource-group>', 'name of the resource group')
        .option('-p, --parameters-file <parameters-file>', 'path to a parameters file')
        .option('--deploy', 'deploy resources, if --deploy is not used, azbb just creates the output files')
        .option('-c, --cloud, <cloud>', 'registered Azure cloud to use (use az cloud list to see all cloud names)')
        .option('-o, --output-file <output-file>', 'output file name prefix')
        .option('-f, --output-format <output-format>', `output format: ${validOutputFormats.join(', ')}`)
        .option('-d, --defaults-directory <defaults-directory>', 'directory containing customized default values')
        .option('-t, --template-base-uri <template-base-uri>', 'base uri for building block templates')
        .option('-k, --sas-token <sas-token>', 'sas token to pass to access template-base-uri')
        .option('-b, --building-blocks <building-blocks>', 'additional building blocks to add to the pipeline')
        .option('--debug', 'passes --debug to Azure CLI for debugging')
        .on('--help', () => {
            console.log();
            console.log('  Visit https://aka.ms/azbbv2 for more information.');
            console.log();
        })
        .parse(process.argv);

    if (process.argv.length < 3) {
        commander.help();
    }

    let options = validateCommandLine({
        commander: commander
    });

    let buildingBlocks = getBuildingBlocks({
        baseUri: options.templateBaseUri,
        additionalBuildingBlocks: options.additionalBuildingBlocks
    });

    let parameters = parseParameterFile({
        parameterFile: options.parametersFile
    });

    let defaultBuildingBlockSettings = generateDefaultBuildingBlockSettings({
        options: options,
        parameters: parameters
    });

    let buildingBlockParameters = _.castArray(parameters.buildingBlocks.value);

    if (buildingBlockParameters.length === 0) {
        throw new Error('no building blocks specified');
    }

    // Create output directory, if not exists (requires Node 10)
    try {
        fs.mkdirSync(options.outputDirectory, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err
    }

    let results = _.map(buildingBlockParameters, (value, index) => {
        let buildingBlockType = value.type;
        let buildingBlock = _.find(buildingBlocks, (value) => {
            return value.type === buildingBlockType;
        });

        if (!buildingBlock) {
            throw new Error(`building block for parameter '${buildingBlockType}' was not found.`);
        }

        // Build the local buildingBlockSettings
        let buildingBlockSettings = {
            subscriptionId: value.subscriptionId ? value.subscriptionId : defaultBuildingBlockSettings.subscriptionId,
            resourceGroupName: value.resourceGroupName ? value.resourceGroupName : defaultBuildingBlockSettings.resourceGroupName,
            location: value.location ? value.location : defaultBuildingBlockSettings.location,
            cloud: defaultBuildingBlockSettings.cloud,
            sasToken: defaultBuildingBlockSettings.sasToken
        };

        let result = processParameters({
            buildingBlock: buildingBlock,
            parameters: value.settings,
            buildingBlockSettings: buildingBlockSettings,
            defaultsDirectory: options.defaultsDirectory
        });

        // Generate deployment name to use in parameters and deployment
        let deploymentName = `bb-${padInteger(index + 1, '00')}-${buildingBlock.deploymentName}`;
        // We need to add the deploymentContext to the template parameter files.
        result.parameters.deploymentContext = {
            parentTemplateUniqueString: deploymentName,
            sasToken: buildingBlockSettings.sasToken
        };

        let templateParameters = createTemplateParameters({
            parameters: result.parameters
        });

        // Attach everything to our result so we can access it later as a unit.
        result.deploymentName = deploymentName;
        result.templateParameters = templateParameters;
        result.buildingBlock = buildingBlock;
        result.buildingBlockSettings = buildingBlockSettings;

        // Add the output filename
        result.outputFilename = path.format({
            dir: options.outputDirectory,
            name: `${options.outputBaseFilename}-${padInteger(index + 1, '00')}`,
            ext: '.json'
        });
        return result;
    });

    // Add the output filenames even if they aren't needed.
    if (results.length === 1) {
        results[0].outputFilename = path.format({
            dir: options.outputDirectory,
            name: options.outputBaseFilename,
            ext: '.json'
        });
    }

    // Output the parameters based on flags
    if (options.outputFormat === 'json') {
        let templateParameters = _.map(results, (value) => {
            return value.templateParameters;
        });

        let output = JSON.stringify((templateParameters.length === 1) ? templateParameters[0] : templateParameters, null, 2);
        console.log(output);
    } else if (options.outputFormat === 'files') {
        _.forEach(results, (value) => {
            let output = JSON.stringify(value.templateParameters);
            fs.writeFileSync(value.outputFilename, output);
            console.log();
            console.log(`  parameters written to ${value.outputFilename}`);
            console.log();
        });
    }

    // We will always write out a deployment script so in the event of a failure,
    // at least steps could be rerun, if necessary.
    generateDeploymentScripts({
        defaultBuildingBlockSettings,
        processedBuildingBlocks: results,
        options
    });

    if (options.deploy) {
        // We need to set the active cloud.  Currently we do not support deployments across clouds.
        az.setCloud({
            name: options.cloud.name,
            azOptions: options.azOptions
        });
        _.forEach(results, (value) => {
            // Get the resources groups to create if they don't exist.  Each block is responsible for specifying these.
            createResourceGroups({
                resourceGroups: value.resourceGroups,
                azOptions: options.azOptions
            });
            if (value.preDeployment) {
                value.preDeployment(value.preDeploymentParameter);
            }
            deployTemplate({
                processedBuildingBlock: value,
                azOptions: options.azOptions
            });
            if (value.postDeployment) {
                value.postDeployment(value.postDeploymentParameter);
            }
        });
    }
} catch (e) {
    console.error();
    console.error(`  error: ${e.message}`);
    console.error();
    process.exit(1);
}
