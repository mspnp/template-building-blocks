![Azure Building Blocks](/images/azbb-ascii.png) &nbsp; &nbsp; &nbsp; ![Azure Building Blocks](/images/az-building-blocks-150.png) 

# Azure Building Blocks: Simplifying Resource Deployment


![Build status](https://travis-ci.org/mspnp/template-building-blocks.svg?branch=master) [![npm version](https://img.shields.io/npm/v/@mspnp/azure-building-blocks.svg?style=flat)](https://www.npmjs.com/package/@mspnp/azure-building-blocks)

> __Important__: The Azure Building Blocks project will not be undergoing further development.  For advanced deployment template capabilities refer to [Bicep](http://aka.ms/bicep), [Azure Resource Manager template specs](http://aka.ms/templatespecs) and the [Azure Resource Manager template documentation](https://aka.ms/arm-template-docs). New development should not leverage Azure Building Blocks.

> __Note__: Version 2.1.1 of Azure Building Blocks introduced breaking changes to versions earlier than 2.0.4. Versions earlier than 2.0.4 will no longer function. Please upgrade to version 2.0.4 or greater to continue using Azure Building Blocks. 

The Azure Building Blocks project is a command line tool and set of Azure Resource Manager templates designed to simplify deployment of Azure resources. Users author a set of simplified parameters to specify settings for Azure resources, and the command line tool merges these parameters with best practice defaults to produce a set of final parameter files that can be deployed with the Azure Resource Manager templates.

# Getting Started

Install the Azure Building Blocks using npm:

```
npm install -g @mspnp/azure-building-blocks
```

Verify the version of azure building blocks you are running using the command below. Make sure you are running version 2.0.4 or later.

```
azbb -V
```

Then, [author an Azure Building Blocks parameter file](https://github.com/mspnp/template-building-blocks/wiki/create-a-template-building-blocks-parameter-file) and [run the `azbb` command line tool](https://github.com/mspnp/template-building-blocks/wiki/command-line-reference).

# Documentation

Full documentation for the command line tool and parameter file schema is available on the [Wiki](https://github.com/mspnp/template-building-blocks/wiki).

# Examples

Azure Building Blocks parameters to deploy three identical VMs:

```json
"type": "VirtualMachine",
"settings": {
    "vmCount": 3,
    "osType": "windows",
    "namePrefix": "test",
    "adminPassword": "testPassw0rd!23",
    "nics": [{"subnetName": "web"}],
    "virtualNetwork": {"name": "ra-vnet"}
}
```

The command line tool merges best practice defaults to the parameters as follows:

-	Enables diagnostics on all VMs
-	Deploys the VMs in an availability set 
-	All VM disks are managed
-	OS is latest Windows Server 2016 image
-	Public IP created for each VM

To add a scaleset with three identical VMs:

```json
"type": "VirtualMachine",
"settings": {
    "vmCount": 3,
    "osType": "windows",
    "namePrefix": "test",
    "adminPassword": "testPassw0rd!23",
    "nics": [{
        "subnetName": "web",
        "isPublic": false
        }],
    "virtualNetwork": {"name": "ra-vnet"},
    "scaleSetSettings": { }
}
```

# Version history

The list below shows changes introduced with the latest versions.

## 2.0.4

- Fixed minor bugs
- Introduced a more rigorous versioning scheme

## 2.1.1

- Introduced breaking changes to versions less than 2.0.4
- Added standalone load balancer building block
- Added standalone application gateway building block
- Changes to VM building block to allow use of pre-existing load balancer and application gateway
- Added support for 'single-step' disk encryption to VM building block

## 2.1.2

- Fixed bug on internal load balancer
- Added support for 'custom data' to VM building block

## 2.2.0

- Added support for Availability Zones and Standard SKU for Load Balancers, Application Gateways, and Public IP Addresses
- Added support for Availability Zones for virtual machines
- Added deployment script generation
- Added NodeJS 10.16.2+ requirement

## 2.2.1
- Added missing subscription parameter

## 2.2.2
- Fixed AZ CLI parameter issues

## 2.2.3
- Fixed Azure Cloud Shell incompatibility

## 2.2.4
- Added lifecycle warnings

# License

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
