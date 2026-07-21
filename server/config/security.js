function requireSecret(name,minimumLength=32){const value=process.env[name]?.trim();if(!value||value.length<minimumLength||/^(default|change|replace|example|secret)/i.test(value))throw new Error(`${name} must be configured with at least ${minimumLength} non-placeholder characters`);return value;}
module.exports={requireSecret,jwtSecret:()=>requireSecret('JWT_SECRET')};
