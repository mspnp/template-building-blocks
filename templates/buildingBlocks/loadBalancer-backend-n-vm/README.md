# loadBalancer-backend-n-vm

Use the loadBalancer-backend-n-vm building block template to deploy an [Azure Load Balancer](https://docs.microsoft.com/azure/load-balancer/load-balancer-overview). This template can also be used to deploy one or more VMs into an availability set.

This building block template supports both public and internal load balancers. You can specify custom load balancer rules, frontend and backend IP pools, [probes](https://docs.microsoft.com/azure/load-balancer/load-balancer-custom-probe-overview), and NAT rules.     


## Parameters

Thre are four parameters in this building block, **loadBalancerSettings**, **virtualMachinesSettings**, **virtualNetworkSettings**, and **buildingBlockSettings**. 


### loadBalancerSettings

The **loadBalancerSettings** parameter specifies properties to configure the Azure Load Balancer. It contains the following properties:

- **name**  
  _Value_. _Required_.  
  Name of the load balancer.  
- **frontendIPConfigurations**  
_Array of objects_. _Required_.  
Specifies configuration settings for the frontend IP pool. The frontend IP configuration is specified using the following object:  
  - **name**  
  _Value_. _Required_.  
  Name of the frontend IP pool.  
  - **loadBalancerType**  
  _Value_. _Required_.  
  Valid values: `internal` | `public`  
  Type of load balancer.  
  - **internalLoadBalancerSettings**  
  _Object_. _Required_.  
  Specifies configuration settings for an internal load balancer. Set to an empty object for public load balancer. The internal load balancer configuration is specified using the following object:  
    - **privateIPAddress**  
    _Value_. _Required_.  
    IP address of the internal load balancer.  
    - **subnetName**  
    _Value_. _Required_.  
    Existing subnet associated with the load balancer's private IP.  
- **loadBalancingRules**  
_Array of objects_. _Required_.  
Specifies configuration settings for one or more traffic handling rules. The traffic handling rule is specified using the following object:  
  - **name**  
  _Value_. _Required_.  
  Name of the rule.  
  - **frontendPort**  
  _Value_. _Required_.  
  Specifies a frontend port on the load balancer to which this rule applies.  
  - **backendPort**  
  _Value_. _Required_.  
  Specifies a port on backend VMs to which the load balancer forwards traffic for this rule.  
  - **protocol**  
  _Value_. _Required_.  
  Valid values: `Tcp` | `Udp`  
  Specifies the protocol used for the rule.  
  - **backendPoolName**  
  _Value_. _Required_.  
  Name of the backend IP pool. See **backendPools** for more information.  
  - **frontendIPConfigurationName**  
  _Value_. _Required_.  
  Name of the frontend IP pool. See **inboundNatRules** for more information.  
  - **enableFloatingIP**  
  _Value_. _Required_.  
  Valid values: `true` | `false`  
  Set to `true` to enable the **backendPort** to be reused for other load balancing rules.  
  - **probeName**  
  _Value_. _Required_.  
  Specifies the name of a health probe used to determine the health of a backend VM. See **probes** for more information.  
- **probes**  
_Array of objects_. _Required_.  
Specifies configuration settings for one or more health probes used by the load balancer to determine the health of a backend VM. The health probes are configured using the following object:  
  - **name**  
  _Value_. _Required_.  
  Name of the health probe. Associate this health probe with a load balancer rule by setting the **probeName** property to it in the **loadBalancingRules** section above.  
  - **port**  
  _Value_. _Required_.  
  Specifies the port number on the backend VM used for the health probe.  
  - **protocol**  
  _Value_. _Required_.  
  Valid values: `Http` | `Tcp`  
  Protocol used for the health probe.  
  - **requestPath**  
  _Value_. _Required if **protocol** is set to `Http`, not used if set to `Tcp`_.  
  Specifies the HTTP path on a backend VM used for the health probe.  
- **backendPools**  
_Array of Objects_. _Required_.  
Specifies configuration settings for a list of backend IP addresses used by the load balancer. The backend pool is configured using the following object:  
  - **name**  
  _Value_. _Required_.  
  Name of the pool.  
  - **nicIndex**  
  _Value_. _Required_.  
  Each of the backend VMs has one or more NICs. This value specifies the number of the NIC on the VM to which the load balancer will send traffic.  
- **inboundNatRules**  
_Array of objects_. _Required_.  
Specifies configuration setting for one or more NAT rules used by the load balancer to direct inbound network traffic. The NAT rules are specified using the following object:  
  - **namePrefix**  
  _Value_. _Required_.  
  Name of the rule.  
  - **frontendIPConfigurationName**  
  _Value_. _Required_.  
  Name of a valid frontend pool specified in the **frontendIPConfigurations** section.  
  - **startingFrontendPort**  
  _Value_. _Required if **frontendPort** is not set_.  
  Specifies a starting port number that the NAT rule will map to a backend VM's port number. The building block template will then increment the port number by one for each VM in the backend pool. For example, if this value is set to `50001` and there are two VMs in the backend pool listening on port `3389`, the first NAT rule will forward traffic received on port `50001` to port `3389` on the first VM and will forward traffic received on port `50002` to port `3389` on the second VM. incrementing this port number for each rule.  
  - **frontendPort**  
  _Value_. _Required if **startingFrontendPort** is not set_.  
  Specifies a port on the load balancer to which this NAT rule applies.  
  - **backendPort**  
  _Value_ _Required_.  
  Specifies a port that the VMs in the backend pool listen on for this NAT rule.  
  - **natRuleType**  
  _Value_. _Required_.  
  Valid values: `all` | `single` | `floatingIP`  
  Specifies port reuse on backend VMs. For more information see [multiple VIPs for Azure load balancer](https://docs.microsoft.com/en-us/azure/load-balancer/load-balancer-multivip-overview).  
  - **protocol**  
  _Value_. _Required_.  
  Valid values: `Tcp` | `Udp`  
  Protocol used for this rule.  
  - **vmIndex**  
  _Value_. _Required if **frontendPort** is set, otherwise optional_.  
  The index number of the VM in the backend pool to which this NAT rule applies. Note that this is zero based. The first VM is **vmIndex** `0`, the second vm is **vmIndex** `1`, and so on.  
  - **nicIndex**  
  _Value_. _Required_.  
  The index number of the NIC on the VM to which this NAT rule applies.  

### virtualMachinesSettings

The **virtualMachinesSettings** parameter specifies properties for the VMs. For more information on the properties in this section, see the **virtualMachinesSettings** parameter section of the [multi-vm-n-nic-m-storage document](https://github.com/mspnp/template-building-blocks/blob/v1.0.0/templates/buildingBlocks/multi-vm-n-nic-m-storage/README.md).

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

1. Right click the button below and select the option to open the link in a new tab or a new window:<br><a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fmspnp%2Ftemplate-building-blocks%2Fv1.0.0%2Fscenarios%2FloadBalancer-backend-n-vm%2Fazuredeploy.json"><img src = "http://azuredeploy.net/deploybutton.png"/></a>
2. Wait for the Azure Portal to open.
3. In the `Basics` section:
  - Select your `Subscription` from the drop-down list.
  - For the `Resource group`, you can either create a new resource group or use an existing resource group.
  - Select the region where you'd like to deploy the VNet in the `Location` drop-down list.
4. In the `Settings` section, enter a URI to a valid parameter file. There are several [example parameter files](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/loadBalancer-backend-n-vm/parameters) in Github. Note that if you want to use one of these parameter files the URI must be the path to the `raw` file in Github. These parameter files require pre-existing VNets and subnets and the deployment will fail if they do not exist. You will need to inspect the parameters to determine these requirements.  

5. Review the terms and conditions, then click the **I agree to the terms and conditions stated above** checkbox.  
6. Click the **Purchase** button.  
7. Wait for the deployment to complete.

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
5. Run the `New-AzureRmResourceGroupDeployment` cmdlet as shown below.  
  ```PowerShell
  New-AzureRmResourceGroupDeployment -ResourceGroupName <Resource Group Name> -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/loadBalancer-backend-n-vm/azuredeploy.json -templateParameterUriFromTemplate <URI of parameter file>
  ```

**Example**  
The cmdlet below deploys the [internal-loadBalancer-multi-backends](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/loadBalancer-backend-n-vm/parameters/internal-loadBalancer-multi-backends.parameters.json) parameter file from the [scenarios folder](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/multi-vm-n-nic-m-storage) in Github.

> Note that this deployment requires an existing VNet named **bb-dev-vnet** in the **bb-dev-rg** resource group. **bb-dev-vnet** also requires a subnet named **biz**.

```PowerShell
New-AzureRmResourceGroupDeployment -ResourceGroupName bb-dev-rg -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/loadBalancer-backend-n-vm/azuredeploy.json -templateParameterUriFromTemplate https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/loadBalancer-backend-n-vm/parameters/internal-loadBalancer-multi-backends.parameters.json 
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
4. Deploy a VNet. For more information see the [vnet-n-subnet](https://github.com/mspnp/template-building-blocks/blob/v1.0.0/templates/buildingBlocks/vnet-n-subnet/README.md) building block template.  
5. Run the command shown below to deploy the VNet
  ```AzureCLI
  az group deployment create -g <Resource Group Name>
  --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/multi-vm-n-nic-m-storage/azuredeploy.json
  --parameters "{\"templateParameterUri\":{\"value\":\"<parameter file public URI>\"}}"
  ```

**Example**  
The command below deploys the [internal-loadBalancer-multi-backends](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/loadBalancer-backend-n-vm/parameters/internal-loadBalancer-multi-backends.parameters.json) parameter file from the [scenarios folder](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/loadBalancer-backend-n-vm) in Github.

> Note that this deployment requires an existing VNet named **bb-dev-vnet** in the **bb-dev-rg** resource group. **bb-dev-vnet** also requires a subnet named **biz**.

```AzureCLI
az login
az group deployment create -g bb-dev-rg --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/loadBalancer-backend-n-vm/azuredeploy.json --parameters "{\"templateParameterUri\":{\"value\":\"https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/loadBalancer-backend-n-vm/parameters/internal-loadBalancer-multi-backends.parameters.json\"}}"
```

> The parameter files in the scenarios folder include hard-coded administrator usernames and passwords. It is **strongly** recommended that you immediately change the administrator password on the NVA VMs when the deployment is complete.