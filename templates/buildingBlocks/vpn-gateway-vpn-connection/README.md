# vpn-gateway-vpn-connection

Use the vpn-gateway-vpn-connection building block to deploy a [VPN Gateway](https://azure.microsoft.com/en-us/documentation/articles/vpn-gateway-about-vpngateways/) to an existing [Azure virtual network (VNet)](https://azure.microsoft.com/en-us/documentation/articles/resource-groups-networking/#virtual-network). The template creates a virtual network gateway, an associated public IP address, and configures the settings related to your local network gateway.

> **Note** that this building block template requires a pre-existing VNet with a subnet named `GatewaySubnet`. If your infrastructure does not have a VNet with these requirements, use the [vnet-n-subnet](https://github.com/mspnp/template-building-blocks/blob/master/templates/buildingBlocks/vnet-n-subnet/README.md) building block template to create one.

## Parameters

There are three parameters in this building block template: **virtualNetworkSettings**, **virtualNetworkGatewaySettings**, **connectionSettings**.
 
### virtualNetworkSettings

The **virtualNetworkSettings** parameter specifies the VNet and resource group where a VPN gateway is deployed. It contains the following properties:

- **name**  
_Value_. _Required_.  
Name of the VNet that the VPN gateway will be deployed in.

- **resourceGroup**  
_Value_. _Required_.  
Name of the resource group that the VPN gateway belongs to.  

### virtualNetworkGatewaySettings

The **virtualNetworkGatewaySettings** parameter specifies the configuration of the virtual gateway device. It contains the following properties:

- **name**  
_Value_. _Required_.  
Specifies the name of the virtual network gateway.  
- **gatewayType**  
_Value_. _Required_.  
Valid values: `Vpn` | `ExpressRoute`  
Type of gateway to create.  
- **vpnType**  
_Value_. _Required_.  
Valid values: `RouteBased` or `PolicyBased`  
Type of VPN routing.  
- **sku**  
_Value_. _Required_.  
Valid values: `Standard` | `High Performance` | `Basic`  
The gateway SKU.  

### connectionSettings

The **connectionSettings** parameter specifies the configuration of the VPN connection, local network gateway, or ExpressRoute settings. It contains the following parameters:

- **name**  
_Value_. _Required_.  
Name of the VPN connection.  
- **connectionType**  
_Value_. _Required_.  
Valid values: `IPsec` | `ExpressRoute`  
VPN connection type.  
- **sharedKey**  
_Value_. _Required if **connectionType** is set to `IPSec`, otherwise set to empty value_.  
The connection key specified for the VPN device.  
- **virtualNetworkGateway1**  
_Object_. _Required_.  
Specifies the virtual network gateway that the connection is associated with. Contains the following object:  
  - **name**  
  _Value_. _Required_.  
  Valid value: the value from the **name** property in the **virtualNetworkSettings** parameter.  
  Name of the virtual network gateway that the connection is associated with.  
- **localNetworkGateway**  
_Object_. _Required if **connectionType** is set to `IPSec`, otherwise set to empty value_.  
Specifies configuration of the local network gateway used by the VPN connection. The local network gateway is configured using the following object:  
  - **name**  
  _Value_. _Required_.  
  Name of the local network gateway.  
  - **ipAddress**  
  _Value_. _Required_.  
  IP address of the gateway server on your local network.  
  - **addressPrefixes**  
  _Array of values_. _Required_.  
  List of CIDR blocks reserved for the local netwwork gateway.  
   **expressRouteCircuit**  
   _Object_. _Required if using ExpressRoute, otherwise set to empty object_.  
   Specifies configuration information for ExpressRoute connections. The configuration information is specified using the following object:  
    - **name**  
    _Value_. _Required_.  
    Name of the ExpressRoute circuit that the connection will use.  

## Deployment

You can deploy this building block template using the Azure portal, PowerShell, or Azure CLI.

### Azure portal

Note that this building block deployment process requires a parameter file stored in a location with a publicly available URI.

1. Right click the button below and select the option to open the link in a new tab or a new window:<br><a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fmspnp%2Ftemplate-building-blocks%2Fv1.0.0%2Fscenarios%2Fvpn-gateway-vpn-connection%2Fazuredeploy.json"><img src = "http://azuredeploy.net/deploybutton.png"/></a>
2. Wait for the Azure Portal to open.  
3. In the `Basics` section:
  - Select your `Subscription` from the drop-down list.
  - For the `Resource group`, you can either create a new resource group or use an existing resource group.
  - Select the region where you'd like to deploy the VNet in the `Location` drop-down list.  
4. In the `Settings` section, enter a URI to a valid parameter file. There are several [example parameter files](https://github.com/mspnp/template-building-blocks/tree/master/scenarios/vpn-gateway-vpn-connection/parameters) in Github. Note that if you want to use one of these parameter files the URI must be the path to the `raw` file in Github. These parameter files require pre-existing VNets and subnets and the deployment will fail if they do not exist. You will need to inspect the parameters to determine these requirements.  
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
  New-AzureRmResourceGroupDeployment -ResourceGroupName <Resource Group Name> -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vpn-gateway-vpn-connection/azuredeploy.json -templateParameterUriFromTemplate <URI of parameter file>
  ```

**Example**  
The cmdlet below deploys the [vpn](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vpn-gateway-vpn-connection/parameters/vpn.parameters.json) parameter file from the [scenarios folder](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/vpn-gateway-vpn-connection) in Github.

> Note that this deployment requires an existing VNet named **bb-dev-vnet** in a resource group named **bb-vpn-rg**. It also requires a virtual network gateway named **bb-hybrid-vpn-vgw**

```PowerShell
New-AzureRmResourceGroupDeployment -ResourceGroupName bb-dev-rg -TemplateUri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vpn-gateway-vpn-connection/azuredeploy.json -templateParameterUriFromTemplate https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vpn-gateway-vpn-connection/parameters/vpn.parameters.json
```
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
  --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vpn-gateway-vpn-connection/azuredeploy.json
  --parameters "{\"templateParameterUri\":{\"value\":\"<parameter file public URI>\"}}"
  ```

**Example**  
The command below deploys the [vpn](https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vpn-gateway-vpn-connection/parameters/vpn.parameters.json) parameter file from the [scenarios folder](https://github.com/mspnp/template-building-blocks/tree/v1.0.0/scenarios/vpn-gateway-vpn-connection) in Github.

> Note that this deployment requires an existing VNet named **bb-dev-vnet** in a resource group named **bb-vpn-rg**. It also requires a virtual network gateway named **bb-hybrid-vpn-vgw**

```AzureCLI
az login
az group deployment create -g bb-dev-rg --template-uri https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vpn-gateway-vpn-connection/azuredeploy.json --parameters "{\"templateParameterUri\":{\"value\":\"https://raw.githubusercontent.com/mspnp/template-building-blocks/v1.0.0/scenarios/vpn-gateway-vpn-connection/parameters/vpn.parameters.json\"}}"
```