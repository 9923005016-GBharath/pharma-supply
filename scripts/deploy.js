const hre = require("hardhat");

async function main() {
  console.log("Deploying PharmaSupplyChain contract...");

  const PharmaSupplyChain = await hre.ethers.getContractFactory("PharmaSupplyChain");
  const pharmaSupplyChain = await PharmaSupplyChain.deploy();

  await pharmaSupplyChain.waitForDeployment();

  const address = await pharmaSupplyChain.getAddress();
  console.log("PharmaSupplyChain deployed to:", address);

  // Register sample users
  console.log("\nRegistering sample users...");
  
  const [admin, supplier, manufacturer, repackager, distributor, pharmacy] = await hre.ethers.getSigners();

  await pharmaSupplyChain.registerUser(supplier.address, "ABC Ingredients Supplier", 2);
  console.log("✓ Registered Ingredient Supplier:", supplier.address);

  await pharmaSupplyChain.registerUser(manufacturer.address, "XYZ Pharmaceuticals", 3);
  console.log("✓ Registered Manufacturer:", manufacturer.address);

  await pharmaSupplyChain.registerUser(repackager.address, "PackMed Repackaging", 4);
  console.log("✓ Registered Repackager:", repackager.address);

  await pharmaSupplyChain.registerUser(distributor.address, "MediDist Distribution", 5);
  console.log("✓ Registered Distributor:", distributor.address);

  await pharmaSupplyChain.registerUser(pharmacy.address, "HealthPlus Pharmacy", 6);
  console.log("✓ Registered Pharmacy:", pharmacy.address);

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Contract Address:", address);
  console.log("Admin (FDA):", admin.address);
  console.log("Ingredient Supplier:", supplier.address);
  console.log("Manufacturer:", manufacturer.address);
  console.log("Repackager:", repackager.address);
  console.log("Distributor:", distributor.address);
  console.log("Pharmacy:", pharmacy.address);
  console.log("=".repeat(60));
  console.log("\nUpdate your backend/.env file with:");
  console.log(`CONTRACT_ADDRESS=${address}`);
  console.log(`PRIVATE_KEY=${admin.address === process.env.DEPLOYER ? 'your_admin_private_key' : 'admin_private_key'}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
