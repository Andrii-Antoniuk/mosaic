// !DONE: Investigate getMosaicConfig
const { getMosaicConfig } = require('./mosaic-config');
// !DONE: Investigate getPackageJson
const { getPackageJson } = require('./package-json');
// !DONE: Investigate getPackagePath
const getPackagePath = require('./package-path');
// !DONE
const logger = require('./logger');
// !DONE Npm package for memoization. Ok.
const memoize = require('memoizee');
const path = require('path');
// !DONE: Dummy check for yarn ver
const shouldUseYarn = require('./should-use-yarn');
const fs = require('fs');

let visitedDeps = [];
const requiredPathPrefixLength = 5;

/**
 * Recursively get "extensions" field from all package.json,
 * do the same for all module dependencies.
 *
 * @param {string} modulePath
 * @return {array} an array of object entries.
 */
const getAllExtensions = (modulePath) => {
    if (visitedDeps.indexOf(modulePath) !== -1) {
        return [];
    }

    visitedDeps.push(modulePath);

    const packageJson = getPackageJson(modulePath);
    const { dependencies = {} } = packageJson;
    const { extensions = {} } = getMosaicConfig(modulePath);

    return Object.keys(dependencies).reduce(
        (acc, dependency) => acc.concat(getAllExtensions(dependency)),
        Object.entries(extensions)
    );
};

const getEnabledExtensions = memoize((pathname = process.cwd()) => {
    // reset visited deps, in case it's the second call to this function
    visitedDeps = [];

    const allExtensions = getAllExtensions(pathname);

    return Array.from(allExtensions.reduceRight(
        // Run reduce backwards - prefer root package declaration
        (acc, [packageName, isEnabled]) => {
            if (isEnabled) {
                acc.add(packageName);
            } else if (acc.has(packageName)) {
                acc.delete(packageName);
            }

            return acc;
        },
        new Set()
    ));
});

const getExtensionsForCwd = memoize((cwd = process.cwd()) => getEnabledExtensions(cwd).reduce((acc, packageName) => {
    try {
        const packagePath = getPackagePath(packageName, cwd);
        const packageJson = getPackageJson(packagePath, cwd);

        acc.push({
            packagePath,
            packageName,
            packageJson
        });
    } catch (e) {
        const installCommand = shouldUseYarn() ? 'yarn add' : 'npm i';

        logger.logN(e);

        logger.error(
            `Loading of plugin ${ logger.style.misc(packageName) } failed.`,
            `Try installing it using ${ logger.style.command(`${ installCommand } ${ packageName } command.`) }`,
            `Otherwise, disable the extension in the root ${ logger.style.file('package.json') } file:`,
            `Append ${ logger.style.code(`"${ packageName }": false`) } line to the end of the ${ logger.style.code('mosaic.extensions') } field.`
        );

        process.exit();
    }

    return acc;
}, []));

const getExtensionsPath = (isOnlyLocalPackages = false) => {
    const { dependencies } = getPackageJson(process.cwd());
    const dependenciesArray = Object.entries(dependencies);

    const extensionsPaths = getExtensionsForCwd().reduce((acc, extension) => {
        const { packageName, packagePath } = extension;

        // Check which extension in dependency list
        const extensionFromDependencies = dependenciesArray.find(
            ([dependencyName]) => dependencyName === packageName
        );

        if (!Array.isArray(extensionFromDependencies)) {
            return acc;
        }

        const [, extensionPathFromDependencies] = extensionFromDependencies;

        // Getting trimmed version for future check if it is extension required from local path
        const trimmedRequiredVersion = extensionPathFromDependencies.slice(0, requiredPathPrefixLength);
        const isRequiredVersionLocal = trimmedRequiredVersion === 'file:' || trimmedRequiredVersion === 'link:';

        // Check if extension is required as local package and remove its prefix to get relative path
        const extensionPath = isRequiredVersionLocal
            ? path.relative(process.cwd(), extensionPathFromDependencies.slice(requiredPathPrefixLength))
            : extensionPathFromDependencies;

        // Get extensions paths which has src folder inside of them
        if (!fs.existsSync(`${extensionPath}/src`)) {
            return acc;
        }

        // Push extensions that are required from local packages
        if (!isOnlyLocalPackages && isRequiredVersionLocal) {
            acc.push(`${extensionPath}/src/**/*`);

            return acc;
        }

        const resultPath = isRequiredVersionLocal
            ? extensionPathFromDependencies.slice(requiredPathPrefixLength)
            : packagePath;

        acc.push(`${path.relative(process.cwd(), resultPath)}/src/**/*`);

        return acc;
    }, []);

    return extensionsPaths;
};

module.exports = {
    getExtensionsForCwd,
    getExtensionsPath
};
