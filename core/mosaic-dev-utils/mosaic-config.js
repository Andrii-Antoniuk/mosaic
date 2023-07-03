// !DONE: Investigate getPackageJson
const { getPackageJson } = require('@tilework/mosaic-dev-utils/package-json');
// !DONE: Just deep merge as it says
const { deepmerge } = require('./deepmerge');

// It is possible to define this config at least, cool.
const defaultConfig = {
    sourceDirectories: [
        'src',
        'pub'
    ]
};

/**
 * This resolves mosaic config
 * Interesting what types of pathname could be
 * @param pathname path to a directory with package.json or package.json object
 * Answer was in d.ts
 */
const getMosaicConfig = (pathname, context = process.cwd()) => {
    const packageJson = typeof pathname === 'string'
        ? getPackageJson(pathname, context)
        : pathname;

    let mosaicConfig = {};

    if (packageJson.mosaic) {
        mosaicConfig = packageJson.mosaic;
    } else if (packageJson.scandipwa) { 
        // fallback to legacy field
        mosaicConfig = packageJson.scandipwa;
    } else { 
        // mosaic config not found
        return {};
    }


    return deepmerge(defaultConfig, mosaicConfig);
};

module.exports = {
    getMosaicConfig
};
