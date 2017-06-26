'use strict';
const childProcess = require('child_process');
const os = require('os');
const _ = require('lodash');
const v = require('./core/validation.js');

let spawnAz = ({args, options}) => {
    if (_.isNil(options)) {
        // Assign default options so nothing unexpected happens
        options = {
            stdio: 'pipe',
            shell: true
        };
    }
    let child = childProcess.spawnSync('az', args, options);
    if (child.status !== 0) {
        throw new Error(`error executing az${os.EOL}  status: ${child.status}${os.EOL}  arguments: ${args.join(' ')}`);
    }

    return child;
};

let setSubscription = ({subscriptionId}) => {
    if (v.utilities.isNullOrWhitespace(subscriptionId)) {
        throw new Error('subscriptionId cannot be undefined, null, empty, or only whitespace');
    }

    let child = spawnAz({
        args: ['account', 'set', '--subscription', subscriptionId],
        options: {
            stdio: 'inherit',
            shell: true
        }
    });

    return child;
};

let createResourceGroupIfNotExists = ({resourceGroupName, location}) => {

    if (v.utilities.isNullOrWhitespace(resourceGroupName)) {
        throw new Error('resourceGroupName cannot be undefined, null, empty, or only whitespace');
    }

    if (v.utilities.isNullOrWhitespace(location)) {
        throw new Error('location cannot be undefined, null, empty, or only whitespace');
    }

     // See if the resource group exists, and if not create it.
    let child = spawnAz({
        args: ['group', 'exists', '--name', resourceGroupName],
        options: {
            stdio: 'pipe',
            shell: true
        }
    });

    // The result has to be trimmed because it has a newline at the end
    if (child.stdout.toString().trim() === 'false') {
        // Create the resource group
        child = spawnAz({
            args: ['group', 'create', '--location', location, '--name', resourceGroupName],
            options: {
                stdio: 'inherit',
                shell: true
            }
        });
    }

    return child;
};

let deployTemplate = ({deploymentName, resourceGroupName, templateUri, parameterFile}) => {
    let child = spawnAz({
        args: ['group', 'deployment', 'create', '--name', deploymentName,
            '--resource-group', resourceGroupName,
            '--template-uri', templateUri.replace(/&/g, (os.platform() === 'win32' ? '^^^&' : '\\&')),
            '--parameters', `@${parameterFile}`],
        options: {
            stdio: 'inherit',
            shell: true
        }
    });

    return child;
};

let getRegisteredClouds = () => {
    let child = spawnAz({
        args: ['cloud', 'list']
    });

    return JSON.parse(child.stdout.toString());
};

exports.createResourceGroupIfNotExists = createResourceGroupIfNotExists;
exports.deployTemplate = deployTemplate;
exports.getRegisteredClouds = getRegisteredClouds;
exports.setSubscription = setSubscription;