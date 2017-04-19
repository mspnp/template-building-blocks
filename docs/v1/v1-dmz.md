---
title: DMZ
---
# DMZ

Use the DMZ template building block template to create a perimeter network, also known as a DMZ. A DMZ allows access to specific network resources while keeping the rest of the network safely isolated from external users. This building block tempalte can be used to deploy resources that secure traffic between Azure and an on-premises datacenter or between Azure and the Internet. 

## Parameters

This building block includes two parameters: **dmzSettings** and **virtualNetworkSettings**.

### dmzSettings

The **dmzSettings** parameter specifies properties to configure the DMZ. It contains the following properties:

- **namePrefix**  
_Value_. _Required_.  
The name prefix applied to all VMs, appliances, and availability sets created by this template.   
- **endpoint**  
_Object_. _Required_.  
The endpoint object contains values that configure the DMZ endpoint. DMZ endpoints are specified using the following object:
  - **hasPublicEndpoint**  
  _Value_. _Required_.  
  Valid values: `yes` | `no`  
  Specifies if the DMZ includes a connection public internet. If `yes`, a public IP will be assigned to the load balancer used by the NVAs.  
  - **domainNameLabel**  
  _Value_. _Required_.  
  Specifies the DNS domain name label for the public IP. Creates a mapping from _domainnamelabel.location_.cloudapp.azure.com to the public IP address in Azure DNS servers.  
  - **internalLoadBalancerSettings**  
  _Object_. _Required_.  
  If **hasPublicEndpoint** is set to `no`, this object specifies the private IP address assigned to the internal load balancer. Set to an empty object if  **hasPublicEndpoint** is set to `yes`. The internal load balancer settings are specified by the following object:  
    - **privateIPAddress**  
    _Value_. _Optional_.  
    The private IP address to use for the load balancer.  
    - **subnetName**  
    _Value_. _Optional_.  
    Specifies the subnet the that internal load balancer is attached to.  
- **applianceSettings**  
_Object_. _Required_.  
Specifies the configuration information for the load balancer and VMs that perform routing between the external and internal networks. The configuration information is specified by the following object:  
  - **ports**  
  _Array of objects_. _At least one required_.  
  Specifies port settings that define a load balancer rule. The port settings are specified by the following object:  
    - **port**  
    _Value_. _Required_.  
    Integer value of the port number used for the load balancing rule.  
    - **protocol**  
    _Value_. _Required_.  
    Valid values: `Tcp` | `Udp`  
    Protocol used for the load balancing rule.  
    - **healthProbe**  
    _Value_. _Required_.  
    Name of the health probe object from the **healthProbes** array below that will be used by the load balancer to monitor health of the VMs.  
  - **healthProbes**  
  _Array of objects_. _At least one required_.  
  Specifies the configuration information for a health probe used by the load balancer to determine the health of a VM. The health probe configuration information is specified by the following object:  
    - **name**  
    _Value_. _Required_.  
    Name of the probe.  
    - **port**  
    _Value_. _Required_.  
    Integer value of the port number probed to check machine health.  
    - **protocol**  
    _Value_. _Required_.  
    Valid values: `Http` | `Tcp`  
    Protocol used to perform the probe.  
    - **requestPath**  
    _Value_. _Required if **protocol** value is `Http`, blank if `Tcp`_.  
    HTTP path to query on the VM for health status.  
  - **virtualMachineSettings**  
  _Object_. _Required_.  
  Specifices the configuration information for the VMs used in the DMZ for firewall and routing services between the external and internal networks. **Note** that only Linux VMs are supported by this building block template. The VM configuration settings are specified by the following object:  
    - **count**  
    _Value_. _Required_.  
    Integer value of the number of VMs to create.  
    - **size**  
    _Value._ _Required_.  
    String representing size of the VMs to create. This string is listed in the `Size` column of the table that describes each VM type in the [sizes for Linux virtual machines in Azure](https://docs.microsoft.com/azure/virtual-machines/virtual-machines-linux-sizes) document. Note that this template creates premium storage accounts and only supports VM sizes that support premium storage. See the 'premium storage-supported VMs' section of the [high-performance premium storage and unmanaged and managed Azure VM disks]((https://docs.microsoft.com/azure/storage/storage-premium-storage) document for more information.  
    - **adminUsername**  
    _Value._ _Required_.  
    Administrator user name for the VM operating system (OS).  
    - **adminPassword**  
    _Value._ _Required if **osAuthenticationType** is `password`, optional if `ssh`_.  
    Administrator password for the VM OS.  
    - **sshPublicKey**  
    _Value._ _Required if **osAuthenticationType** is `ssh`, set to empty value if `password`_.  
    SSH key for the VM OS Administrator account.  
    - **osAuthenticationType**  
    _Value_. _Required_.  
    Valid values: `password` | `ssh`  
    Login authentication type, either using a password or SSH key.  
    - **imageReference**  
    _Object_. _Required_.  
    Specifies the OS image for the VM. Only Linux based images are supported. The operating system is specified by the following object:  
      - **publisher**  
      _Value_. _Required_.  
      Publisher of the OS. Note that valid strings for this value as well as the next three values can be obtained using [Azure CLI](https://docs.microsoft.com/azure/virtual-machines/virtual-machines-linux-cli-ps-findimage) or [PowerShell](https://msdn.microsoft.com/en-us/library/azure/dn495275.aspx).  
      - **offer**  
      _Value_. _Required_.  
      OS offer.  
      - **sku**  
      _Value._ _Required_.  
      OS Product SKU.  
      - **version**  
      _Value_. _Required_.  
      OS Version.  
    - **extensions**  
    _Array of objects_. _At least one required_.  
    Specifies configuration information for [VM Extensions](https://docs.microsoft.com/azure/virtual-machines/virtual-machines-linux-extensions-features).  The VM extension configuration is specified using the following object:  
      - **name**  
      _Value_. _Required_.  
      Specifies the display name of this extension.  
      - **publisher**  
      _Value_. _Required_.  
      Extension publisher name.  
      - **type**  
      _Value_. _Required_.  
      Extension type.  
      - **typeHandlerVersion**  
      _Value_. _Required_.  
      Extension version.  
      - **autoUpgradeMinorVersion**  
      _Value_. _Required_.  
      Valid values: `true` | `false`  
      Specifies if the extension is allowed to upgrade automatically.  
      - **settingsConfigMapperUri**  
      _Value_. _Required_.  
      Valid value: `https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/templates/resources/Microsoft.Compute/virtualMachines/extensions/vm-extension-passthrough-settings-mapper.json`  
      - **settingsConfig**  
      _Object_. _Required_.  
      Object specifying extension-specific settings. Set to empty if there are none.  
      - **protectedSettingsConfig**  
      _Object_. _Required_.  
      Object specifying extension-specific settings to be encrypted. Set to empty if there are none.  
- **securedAddressSpace**  
_Array of values_. _Required_.  
Specifies an array of CIDR blocks defining the secured internal subnets that the DMZ can communicate with.  
- **subnets**  
_Object_. _Required_.  
Specifies the subnets used by the NICs handling traffic traffic through the DMZ. The subnets are specified by the following object:  
  - **useExistingSubnets**  
  _Value_. _Required_.  
  Valid values: `yes` | `no`  
  Set to `yes` to use pre-existing subnets or set to `no` to create new ones.  
  - **inSubnet**  
  _Object_. _Required_.  
  Specifies settings for the subnet handling traffic coming from the unsecured external network. The subnet is specified using the following object:  
    - **name**  
    _Value_. _Required_.  
    Name of subnet.  
    - **addressPrefix**  
    _Value_. _Required_.  
    If **useExistingSubnets** is set to `no`, specify a CIDR block to use when defining new subnet. Otherwise, set this to an empty value.  
  - **outSubnet**  
  _Object_. _Required_.  
  Specifies settings for the subnet handling traffic going out to the secured internal network. The subnet is specified using the following object:  
    - **name**  
    _Value_. _Required_.  
    Name of subnet to use.  
    - **addressPrefix**  
    _Value_. _Required_.  
    If **useExistingSubnets** is set to `no`, specify a CIDR block to use when defining new subnet. Otherwise, leave this value empty.  

### virtualNetworkSettings

The **virtualNetworkSettings** parameter is an object that specifies the existing VNet and resource group associated with your DMZ. It contains the following properties:

- **name**  
_Value_. _Required_.  
Specifies the name of the existing VNet that the DMZ will be deployed to.  
- **resourceGroup**  
_Value_. _Required_.  
Specifies the name of the existing Azure Resource Group that the DMZ belongs to.  

## Deployment

You can deploy a building block by using the Azure portal, PowerShell, or Azure CLI.

### Azure portal

To deploy this building block template using a parameter file at a publicly hosted URI, follow these steps:

1. Click the button below:<br><a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fmspnp%2Ftemplate-building-blocks%2Fv1.0.0%2Fscenarios%2Fdmz%2Fazuredeploy.json" target="_blank"><img src = "http://azuredeploy.net/deploybutton.png"/></a>
2. Wait for the Azure Portal to open.
3. In the `Basics` section:
  - Select your `Subscription` from the drop-down list.
  - For the `Resource group`, you can either create a new resource group or use an existing resource group.
  - Select the region where you'd like to deploy the VNet in the `Location` drop-down list.
4. In the `Settings` section, enter a URI to a valid parameter file. There are several [example parameter files](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/dmz/parameters) in Github. Note that if you want to use one of these parameter files the URI must be the path to the `raw` file in Github. 
5. Review the terms and conditions, then click the **I agree to the terms and conditions stated above** checkbox.
6. Click the **Purchase** button.
7. Wait for the deployment to complete.

### PowerShell

To deploy this building block template using a parameter file hosted at a publicly available URI, follow these steps:

1. Upload your parameter file to a location with a publicly available URI.
2. Log in to Azure using your selected subscription:
```powershell
Login-AzureRmAccount -SubscriptionId <your subscription ID>
```
3. If you do not have an existing resource group, run the **New-AzureRmResourceGroup** cmdlet to create one as shown below:
```powershell
New-AzureRmResourceGroup -Location <Target Azure Region> -Name <Resource Group Name> 
```
4. Deploy a VNet. For more information see the [vnet-n-subnet](https://github.com/mspnp/template-building-blocks/blob/v1.0.0/templates/buildingBlocks/vnet-n-subnet/README.md) building block template.  
5. Run the **New-AzureRmResourceGroupDeployment** cmdlet as shown below:  
```powershell
New-AzureRmResourceGroupDeployment -ResourceGroupName <Resource Group Name> -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/dmz/azuredeploy.json -templateParameterUriFromTemplate <URI of parameter file>
```

#### Example

The cmdlet below creates deploys the [internal-dmz-new-subnets](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/dmz/parameters/internal-dmz-new-subnets.parameters.json) parameter file from the [scenarios folder](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/dmz/parameters) in Github.

Note that this scenario requires an existing resource group named `bb-dev-rg`, and a VNet named `bb-dev-vnet` with a `10.0.0.0/22` address space. The VNet must have one subnet with a `10.0.1.0/24` address space, one with a `10.0.2.0/24` address space, and one named `GatewaySubnet` with any address space.

```powershell
New-AzureRmResourceGroupDeployment -ResourceGroupName bb-dev-rg -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/dmz/azuredeploy.json   -templateParameterUriFromTemplate https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/dmz/parameters/internal-dmz-new-subnets.parameters.json
```

> The parameter files in the scenarios folder include hard-coded administrator usernames and passwords. It is **strongly** recommended that you immediately change the administrator password on the NVA VMs when the deployment is complete.

### Azure CLI

Before you begin, install the latest version of the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli).

To deploy the building block template using a parameter file hosted at a publicly available URI, follow these steps:

1. Upload your parameter file to a location with a publicly available URI.
2. Log in to Azure using your selected subscripton:
```batch
az login
```
3. Set your selected subscription:
```batch
az account set --subscription <your subscripton ID>
```
4. If you do not have an existing resource group, create a new one using the following command:
```batch
az group create -l <Target Azure Region> -n <Resource Group Name> 
```
5. Deploy a VNet. For more information see the [vnet-n-subnet](https://github.com/mspnp/template-building-blocks/blob/v1.0.0/templates/buildingBlocks/vnet-n-subnet/README.md) building block template.  
6. Run the `az group deployment create` command as shown below:
```batch
az group deployment create -g <Resource Group Name> --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/dmz/azuredeploy.json 
 --parameters "{\"templateParameterUri\":{\"value\":\"<parameter file public URI>\"}}"
```

#### Example

The cmdlet below deploys the [internal-dmz-new-subnets](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/dmz/parameters/internal-dmz-new-subnets.parameters.json) parameter file from the [scenarios folder](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/dmz/parameters) in Github.  

Note that this scenario requires an existing resource group named `bb-dev-rg`, and a VNet named `bb-dev-vnet` with a `10.0.0.0/22` address space. The VNet must have one subnet with a `10.0.1.0/24` address space, one with a `10.0.2.0/24` address space, and one named `GatewaySubnet` with any address space.

```batch
az login
az group deployment create -g bb-dev-rg --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/dmz/azuredeploy.json --parameters "{\"templateParameterUri\":{\"value\":\"https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/dmz/parameters/internal-dmz-new-subnets.parameters.json\"}}"
```

> The parameter files in the scenarios folder include hard-coded administrator usernames and passwords. It is **strongly** recommended that you immediately change the administrator password on the NVA VMs when the deployment is complete.