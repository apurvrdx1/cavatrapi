const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch all workspace packages
config.watchFolders = [workspaceRoot]

// Map @cavatrapi/* packages directly to their TypeScript source entry points.
// This bypasses the compiled dist/ ESM output, which Metro mis-handles as an
// ES module and injects import.meta — causing runtime crashes on web.
const workspacePackages = {
  '@cavatrapi/shared': path.resolve(workspaceRoot, 'packages/shared/src/index.ts'),
  '@cavatrapi/engine': path.resolve(workspaceRoot, 'packages/engine/src/index.ts'),
  '@cavatrapi/ai': path.resolve(workspaceRoot, 'packages/ai/src/index.ts'),
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect workspace package imports to TS source
  if (workspacePackages[moduleName]) {
    return { filePath: workspacePackages[moduleName], type: 'sourceFile' }
  }
  // Resolve .js imports to source files (ESM-style relative imports within packages)
  if (moduleName.endsWith('.js')) {
    try {
      return context.resolveRequest(context, moduleName.slice(0, -3), platform)
    } catch {
      // fall through to default
    }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
