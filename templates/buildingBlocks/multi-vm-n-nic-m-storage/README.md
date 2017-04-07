# multi-vm-n-nic-m-storage

The multi-vm-n-nic-m-storage template building block deploys [virtual machines (VMs)](https://docs.microsoft.com/azure/virtual-machines/) to an existing [Azure virtual network (VNet)](https://docs.microsoft.com/azure/virtual-network/). 

If you don't have a VNet deployed, use the [vnet-n-subnet](https://github.com/mspnp/template-building-blocks/tree/master/scenarios/vnet-n-subnet) building block to create one.

In addition to defining the OS and Storage configuration of newly created VMs, this block allows you to create multiple [network interfaces (NICs)](https://docs.microsoft.com/azure/virtual-network/resource-groups-networking#nic) and configure [VM extensions](https://docs.microsoft.com/azure/virtual-machines/windows/extensions-features) for your VMs. It also allows you to create a new availability set for you machines, or use an existing one.

## Parameters

This building block includes three parameters: **virtualMachinesSettings**, **virtualNetworkSettings**, and **buildingBlockSettings**. 

### virtualMachinesSettings

The **virtualMachinesSettings** parameter specifies properties for the VMs. It contains the following properties:

- **namePrefix**  
  _Value_. _Required_.  
  Specifies the name prefix used for each VM deployed by this template.  
- **computerNamePrefix**  
  _Value_. _Required_.  
  Specifies the host name prefix for each VM's operating system.  
- **size**  
  _Value._ _Required_.  
  String representing size of the VMs to create. This string is listed in the `Size` column of the table that describes each VM type in the [sizes for Linux virtual machines in Azure](https://docs.microsoft.com/azure/virtual-machines/virtual-machines-linux-sizes) document. Note that this template creates premium storage accounts and only supports VM sizes that support premium storage. See the 'premium storage-supported VMs' section of the [high-performance premium storage and unmanaged and managed Azure VM disks](https://docs.microsoft.com/azure/storage/storage-premium-storage) document for more information.  
- **osType**  
  _Value_. _Required_.  
  Valid values: `linux` | `windows`  
  Specifies the operating system to install.  
- **adminUsername**  
   _Value._ _Required_.  
  Administrator user name for the VM operating system (OS). Note that if you use this template in a production environment, you should store these parameter files in a secure location to prevent leakage of the administrator username.
- **adminPassword**  
  _Value._ _Required if **osAuthenticationType** is **password**, optional if **ssh**_.  
  Administrator password for the VM OS.  Note that if you use this template in a production environment, you should store these parameter files in a secure location to prevent leakage of the administrator password.
- **sshPublicKey**  
  _Value._ _Required if **osAuthenticationType** is **ssh**, optional if **password**_.  
  SSH key for the VM OS Administrator account. Note that if you use this template in a production environment, you should store these parameter files in a secure location to prevent leakage of the SSH key.
- **osAuthenticationType**  
  _Value_. _Required_.  
  Valid values: `password` | `ssh`  
  Login authentication type, either using a password or SSH key (Linux only).  
- **nics**  
  _Array of objects_. _Required_.  
  Specifies configuration settings for VM network interfaces. The network interface configuration is specified using the following object:  
    - **isPublic**  
    _Value_. _Required_.  
    Valid values: `true` | `false`  
    Specifies if the network interface is accessible from the public internet.  
    - **subnetName**  
    _Value_. _Required_.  
    Specifies the name of the subnet that the NIC is connected to.  
    - **privateIPAllocationMethod**  
    _Value_. _Required_.  
    Valid values: `static` | `dynamic`  
    Specifies how the private IP address is allocated.  
    - **publicIPAllocationMethod**  
    _Value_. _Optional_.  
    Valid values: `static` | `dynamic`  
    Specifies how the public IP address is allocated.  
    - **startingIPAddress**  
    _Value_. _Optional_.  
    If **isPublic** is set to `false` and **privateIPAllocationMethod** is set to `static`, specifies the IP address assigned to the NIC of the first VM created during deployment. The IP address for subsequent VMs is incremented by one.  
    - **enableIPForwarding**  
    _Value_. _Required_.  
    Valid values: `true` | `false`  
    Specifies that the NIC will forward IP traffic. For more information on IP forwarding, see the "IP forwarding" section of [user-defined route and IP forwarding](https://docs.microsoft.com/azure/virtual-network/virtual-networks-udr-overview).  
    - **dnsServers**  
    _Array of values_. _Required_.  
    Defines one or more custom DNS Server addresses of the NIC. Leave blank to use Azure internal name resolution.  
    - **isPrimary**  
    _Value_. _Required_.  
    Valid values: `true` | `false`  
    Set to `true` if this is the primary NIC for the VM, otherwise `false`.  
- **imageReference**  
  _Object_. _Required_.  
  Specifies the OS image for the VM. The operating system is specified by the following object:  
    - **publisher**  
    _Value_. _Required_.  
    Publisher of the OS. Note that valid strings for this value as well as the next three values can be obtained using [Azure CLI](https://docs.microsoft.com/azure/virtual-machines/virtual-machines-linux-cli-ps-findimage) or [PowerShell](https://msdn.microsoft.com/library/azure/dn495275.aspx).  
    - **offer**  
    _Value_. _Required_.  
    OS offer.  
    - **sku**  
    _Value._ _Required_.  
    OS Product SKU.  
    - **version**  
    _Value_. _Required_.  
    OS Version. Set this to `latest` to use the latest version of the OS.  
- **dataDisks**  
_Object_. _Required_.  
Specifies the number and other properties for data disks created for the VMs.  The data disk properties are specified using the following object:  
  - **count**  
  _Value_. _Required_.  
  The number of data disks created. Set to `0` for none.  
  - **properties**  
  _Object_. _Required_.  
  Specifies other properties of the data disks created. Set this to an empty object if `count` is set to `0`. The other properties are specified using the following object:  
    - **diskSizeGB**  
    _Value_. _Required_.  
    Data disk size in GB.  
    - **caching**  
    _Value._ _Required_.  
    Valid values: `Read` | `ReadWrite` | `None`  
    Specifies cache settings for the data disk. `Read` sets write through caching, `ReadWrite` sets write back caching, and `None` sets no caching.  
    - **createOption**  
    _Value_. _Required_.  
    Valid value: `Empty`  
    Specifes the type of data disk created. Only `Empty` disks are currently supported.  
- **osDisk**  
_Object_. _Required_.  
Specifies properties for OS disks created for the VMs. The OS disk properties are specified using the following object:  
  - **caching**  
  Valid values: `Read` | `ReadWrite` | `None`  
  Specifies cache settings for the data disk. `Read` sets write through caching, `ReadWrite` sets write back caching, and `None` sets no caching.    
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
- **availabilitySet**  
_Object_. _Required_.  
Specifies configuration information for the availability set that the VMs will be included in. The availability set configuration information is specified using the following object:  
  - **useExistingAvailabilitySet**  
  _Value_. _Required_.  
  Valid values: `Yes` | `No`  
  Specifies if an existing availability set is used. If `Yes`, the **name** value below is used to identify the existing availability set. If `No`, the **name** value below is used to create the availability set.  
  - **name**  
  _Value_. _Required_.  
  The name of the availability set.  

### virtualNetworkSettings

The **virtualNetworkSettings** parameter specifies the VNet for the VMs. It contains the following properties:

- **name**  
_Value_. _Required_.  
Name of an existing VNet.  
- **resourceGroup**  
_Value_. _Required_.  
Resource group that the VNet will be created in.

### buildingBlockSettings

The **buildingBlockSettings** parameter specifies properties for the deployment. It contains the following properties:

- **storageAccountsCount**  
_Value_. _Required_.  
Number of storage accounts to create.  
- **vmCount**  
_Value_. _Required_.  
Number of VMs to create.  
- **vmStartIndex**  
_Value_. _Required_.  
The starting index of the value that will be added to the **namePrefix** and **computerNamePrefix** names for the VM.

> Note that if there are fewer storage accounts created than VMs, the building block distributes the VMs across the storage accounts as evenly as possible. For example, if you create 2 storage accounts, and 6 VMs, 3 VMs will be deployed to each storage account. 

## Deployment

You can deploy this building block using the Azure portal, PowerShell, or Azure CLI.

### Azure portal

Note that this building block deployment process requires a parameter file stored in a location with a publicly available URI.

1. Right click the button below and select the option to open the link in a new tab or a new window:<br><a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fmspnp%2Ftemplate-building-blocks%2Fv1.0.0%2Fscenarios%2Fmulti-vm-n-nic-m-storage%2Fazuredeploy.json"><img src = "http://azuredeploy.net/deploybutton.png"/></a>
2. Wait for the Azure Portal to open.
3. In the `Basics` section:
  - Select your `Subscription` from the drop-down list.
  - For the `Resource group`, you can either create a new resource group or use an existing resource group.
  - Select the region where you'd like to deploy the VNet in the `Location` drop-down list.
4. Deploy a VNet. For more information see the [vnet-n-subnet](https://github.com/mspnp/template-building-blocks/blob/v1.0.0/templates/buildingBlocks/vnet-n-subnet/README.md) building block template.
5. In the `Settings` section, enter a URI to a valid parameter file. There are several [example parameter files](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/multi-vm-n-nic-m-storage/parameters) in Github. Note that if you want to use one of these parameter files the URI must be the path to the `raw` file in Github. These parameter files require pre-existing VNets and subnets and the deployment will fail if they do not exist. You will need to inspect the parameters to determine these requirements.  
6. Review the terms and conditions, then click the **I agree to the terms and conditions stated above** checkbox.  
7. Click the **Purchase** button.  
8. Wait for the deployment to complete.  

### PowerShell

To deploy the building block template using a parameter file hosted at a publicly available URI, follow these steps:

1. Upload your parameter file to a location with a publicly available URI.
2. Log in to Azure using your selected subscription:
  ```Powershell
  Login-AzureRmAccount -SubscriptionId <your subscription ID>
  ```
3. If you do not have an existing resource group, run the `New-AzureRmResourceGroup` cmdlet to create one as shown below:
  ```PowerShell
  New-AzureRmResourceGroup -Location <Target Azure Region> -Name <Resource Group Name> 
  ```
4. Deploy a VNet. For more information see the [vnet-n-subnet](https://github.com/mspnp/template-building-blocks/blob/v1.0.0/templates/buildingBlocks/vnet-n-subnet/README.md) building block template.  
5. Run the `New-AzureRmResourceGroupDeployment` cmdlet as shown below:  
  ```PowerShell
  New-AzureRmResourceGroupDeployment -ResourceGroupName <Resource Group Name> -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/dmz/azuredeploy.json -templateParameterUriFromTemplate <URI of parameter file>
  ```

**Example**  
The cmdlet below deploys the [single-vm](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/multi-vm-n-nic-m-storage/parameters/single-vm.parameters.json) parameter file from the [scenarios folder](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/multi-vm-n-nic-m-storage) in Github.

> Note that this deployment requires an existing VNet named **bb-dev-vnet** in the **bb-dev-rg** resource group. **bb-dev-vnet** also requires a subnet named **management**.

```PowerShell
New-AzureRmResourceGroupDeployment -ResourceGroupName bb-dev-rg -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/multi-vm-n-nic-m-storage/azuredeploy.json -templateParameterUriFromTemplate https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/multi-vm-n-nic-m-storage/parameters/single-vm.parameters.json 
```

> The parameter files in the scenarios folder include hard-coded administrator usernames and passwords. It is **strongly** recommended that you immediately change the administrator password on the NVA VMs when the deployment is complete.

### Azure CLI

Before you begin, install the latest version of the [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli).

To deploy the building block template using a parameter file hosted at a publicly available URI, follow these steps:

1. Upload your parameter file to a location with a publicly available URI.
2. Log in to Azure using your selected subscripton:
  ```AzureCLI
  az login
  ```
3. Set your selected subscription:
  ```AzureCLI
  az account set --subscription <your subscripton ID>
  ```
4. If you do not have an existing resource group, create a new one using the following command:
  ```AzureCLI
  az group create -l <Target Azure Region> -n <Resource Group Name> 
  ```
5. Deploy a VNet. For more information see the [vnet-n-subnet](https://github.com/mspnp/template-building-blocks/blob/v1.0.0/templates/buildingBlocks/vnet-n-subnet/README.md) building block template.  
6. Run the command shown below:
  ```AzureCLI
  az group deployment create -g <Resource Group Name>
  --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/multi-vm-n-nic-m-storage/azuredeploy.json
  --parameters "{\"templateParameterUri\":{\"value\":\"<parameter file public URI>\"}}"
  ```

**Example**  
The command below deploys the [single-vm](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/multi-vm-n-nic-m-storage/parameters/single-vm.parameters.json) parameter file from the [scenarios folder](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/multi-vm-n-nic-m-storage) in Github.

> Note that this deployment requires an existing VNet named **bb-dev-vnet** in the **bb-dev-rg** resource group. **bb-dev-vnet** also requires a subnet named **management**.

```AzureCLI
az group deployment create -g bb-dev-rg --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/multi-vm-n-nic-m-storage/azuredeploy.json --parameters "{\"templateParameterUri\":{\"value\":\"https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/multi-vm-n-nic-m-storage/parameters/single-vm.parameters.json\"}}"
```

> The parameter files in the scenarios folder include hard-coded administrator usernames and passwords. It is **strongly** recommended that you immediately change the administrator password on the NVA VMs when the deployment is complete.