const path = require('path');

/**
 * Get package JSON, or empty object
 *
 * @param {string} pathname
 * @return {object}
 */
const getPackageJson = (pathname, context = process.cwd()) => {
    try {
        /**
         *  require.resolve will return full path to the package.json
         *  it also does include the pathname as arg... 
         *  Interesting why
         *
         *  ? Looks like context is made for quicker resolution of the package.json?
         */

        const pathToPackageJson = require.resolve(
            path.join(pathname, 'package.json'),
            { paths: [context] }
        );

        /**
         * this will return the package.json itself? Well, like JSON object, looks like it
         */
        return require(pathToPackageJson) || {};
    } catch (e) {
        return {};
    }
};

module.exports = {
    getPackageJson
};
