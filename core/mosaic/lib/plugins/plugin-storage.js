import getGlobalContext from '../context/get-global-context';
import { generateConfig, mergePluginConfig } from './generate-config';

class PluginStorage {
    constructor() {
        // Plugins' storage, ex: window.plugins
        this.plugins = [];
    }

    exposePlugins() {
        // Expose this.plugins to the global context
        // For debugging convenience; this is not used in the code
        getGlobalContext().plugins = this.plugins;
    }

    addPlugins(importArray) {
        const newPlugins = generateConfig(importArray);


        // ?So is it array or an object??
        if (!this.plugins) {
            this.plugins = {};
        }

        mergePluginConfig(this.plugins, newPlugins);
        this.exposePlugins();
    }

    setPlugins(importArray) {
        this.plugins = generateConfig(importArray);
        this.exposePlugins();
    }
}

export default new PluginStorage();
