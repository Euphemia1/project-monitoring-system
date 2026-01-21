# Hostinger Compatibility Guide

## Current Issue: pnpm Not Available During Build

### Problem
The build process is failing on Hostinger with the error:
```
Error: spawn pnpm ENOENT
```

This happens because:
1. Hostinger's build environment may default to pnpm
2. The pnpm package manager is not installed or available
3. The build process tries to install TypeScript types with pnpm but fails

### Solution: Configure for npm Compatibility

#### 1. Create .npmrc file
Create a `.npmrc` file in your project root to force npm usage:

```
engine-strict=false
legacy-peer-deps=true
```

#### 2. Pre-install Dependencies
Since Hostinger may have issues installing dependencies during build, pre-build locally:

```bash
# Install all dependencies
npm install

# Build locally first to ensure everything works
npm run build

# If successful, deploy the built version
```

#### 3. Alternative: Use a Different Build Approach

If the issue persists, consider using a different approach:

**Option A: Pre-build before deployment**
- Build the project locally
- Deploy the built files directly

**Option B: Configure package.json for better compatibility**
```json
{
  "scripts": {
    "prebuild": "npm install",
    "build": "next build",
    "start": "next start"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### 4. Check Hostinger Node.js Version
Make sure your Hostinger account is using Node.js 18 or higher, which is required for Next.js 16.

#### 5. Alternative Build Commands
Try changing the build command in your Hostinger deployment settings to:
```
npm run build
```

Instead of letting it auto-detect.

## Recommended Fix: Add .npmrc File

Add the following `.npmrc` file to your project root:

```
engine-strict=false
legacy-peer-deps=true
prefer-offline=true
```

This will help with dependency resolution and force npm usage instead of pnpm.

## Updated Deployment Process

1. **Add the .npmrc file** to your project
2. **Clear Hostinger build cache** if possible
3. **Trigger a fresh deployment**
4. **Monitor the build logs** for any remaining issues

## Troubleshooting

If the issue continues:

1. **Contact Hostinger Support** about pnpm availability
2. **Try manual deployment** via FTP with pre-built files
3. **Consider using a different hosting provider** if build issues persist

## Next.js Security Warning

Regarding the warning about Next.js 16.0.7 having a security vulnerability:
- The latest patched version is indeed 16.0.7 according to the security advisory
- If Hostinger supports newer versions of Next.js, you may consider upgrading
- However, make sure any upgrade maintains compatibility with your current codebase

## Verification Checklist
- [ ] .npmrc file added to project root
- [ ] engine-strict=false set
- [ ] legacy-peer-deps=true set
- [ ] Prefer offline installation enabled
- [ ] Re-deployed to Hostinger
- [ ] Build process completes successfully
- [ ] Application runs properly after deployment