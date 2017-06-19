'use strict';

let _ = require('lodash');
let v = require('./validation.js');

function process(publicIPSettings) {
    let instance = {};
    return _.transform(_.castArray(instance), (result) => {
        instance = {
            name: `${publicIPSettings.namePrefix}-pip`,
            properties: {
                publicIPAllocationMethod: publicIPSettings.publicIPAllocationMethod
            }
        };

        if (!v.utilities.isNullOrWhitespace(publicIPSettings.domainNameLabel)) {
            instance.properties.dnsSettings = {};
            instance.properties.dnsSettings.domainNameLabel = publicIPSettings.domainNameLabel;
        }
        result.push(instance);
        return result;
    }, []);
}

exports.processPipSettings = process;
