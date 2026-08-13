import { validateProductionConfig } from "../lib/config/production.ts";
const issues=validateProductionConfig();if(issues.length){console.error("Production configuration: FAIL");for(const issue of issues)console.error(`${issue.field}: ${issue.message}`);process.exit(1);}console.log("Production configuration: PASS");
