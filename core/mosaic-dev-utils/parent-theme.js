// !DONE: Investigate logger
const logger = require('@tilework/mosaic-dev-utils/logger');
// !DONE: Investigate getPackageJson
const { getPackageJson } = require('@tilework/mosaic-dev-utils/package-json');
/**
 * !DONE: Investigate getPackagePath
 * ? Why using both named and default exports?
 */
const getPackagePath = require('@tilework/mosaic-dev-utils/package-path');

/**
 * !DONE: Investigate getMosaicPath
 * ? Why both package and relative resolution???
 */
const { getMosaicConfig } = require('./mosaic-config');

// get parent theme pachage name
const getParentTheme = (pathname) => {
    const { parentTheme } = getMosaicConfig(pathname);

    return parentTheme;
};

const getParentThemePaths = (pathname = process.cwd(), rootTheme = pathname) => {
    // parent theme package name 
    const parentThemePackage = getParentTheme(pathname);

    if (!parentThemePackage) {
        return [];
    }
    
    const parentThemePathname = getPackagePath(parentThemePackage, rootTheme);

    return [
        parentThemePathname,
        // Recursion, checks for every parent theme
        ...getParentThemePaths(parentThemePathname, rootTheme)
    ];
};

// Returns list of pathnames of themes
const getParentThemeSources = () => {
    const parentThemeList = getParentThemePaths();

    return parentThemeList.reduce((acc, pathname) => {
        const packageJson = getPackageJson(pathname);
        const {
            name
        } = packageJson;

        let themeAlias;

        if (packageJson.mosaic) {
            themeAlias = packageJson.mosaic.themeAlias;
        } else if (packageJson.scandipwa) { // fallback to legacy field
            themeAlias = packageJson.scandipwa.themeAlias;
        }

        const fieldName = !packageJson.mosaic
            ? 'scandipwa'
            : 'mosaic';

        if (!themeAlias) {
            // Prevent themes without a name
            // TODO: fallback to package name

            logger.error(
                `The parent theme registered in package ${logger.style.misc(name)} is invalid.`,
                `The required field ${logger.style.code(`${fieldName}.themeAlias`)} is missing in ${logger.style.file('package.json')}`
            );

            process.exit(1);
        }

        if (acc[themeAlias]) {
            // Prevent similar theme names

            const {
                name: sameNamePackage
            } = getPackageJson(acc[themeAlias]);

            logger.error(
                `The parent theme registered in package ${logger.style.misc(name)} is invalid.`,
                `The required field ${logger.style.code(`${fieldName}.themeName`)} contains invalid value.`,
                `The theme with the name ${logger.style.misc(themeAlias)} already exist.`,
                `It was previously declared in the ${logger.style.misc(sameNamePackage)} package.`
            );

            process.exit(1);
        }

        return {
            ...acc,
            [themeAlias]: pathname
        };
    }, {});
};

const getParentThemeAliases = () => {
    const parentThemeSources = getParentThemeSources();

    // Use theme alias as a key
    return Object.keys(parentThemeSources).reduce((acc, key) => ({
        ...acc,
        [key]: key
    }), {});
};

module.exports = {
    getParentTheme,
    getParentThemePaths,
    getParentThemeSources,
    getParentThemeAliases
};
