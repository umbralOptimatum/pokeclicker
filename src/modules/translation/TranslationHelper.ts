import type { TranslationNamespace } from './Translation';
import { pokemonList } from '../pokemons/PokemonList';
import * as DownloadUtil from '../utilities/DownloadUtil';
import GameHelper from '../GameHelper';

export default class TranslationHelper {
    /**
     * Replaces English pokemon names in a string with the corresponding translation key.
     * 
     * Creates the arrow function within a closure so the RegExp list doesn't need to be rebuilt for each call.
     */
    private static replacePokemonNames: (string) => string = (() => {
        // regex matches escaped pokemon name, if not adjacent to a word character (i.e. mid-string) and not already part of a translation key
        // reversed to catch more-specific alt forms before the base name
        const pokemonNames = pokemonList.map(p => {
            return RegExp(String.raw`(?<!\w|\[\[pokemon::)(${p.name.replace(/([()-.?])/g, '\\$1')})(?!\w|]])`, 'g');
        }).reverse();
        return (text) => pokemonNames.reduce((t, regex) => t.replace(regex, '[[pokemon::$1]]'), text);
    })();

    /**
     * Converts translation key/defaults to a tree as in the actual translation files.
     * @param namespace - The translation namespace to export
     * @param keyOrder - Optional array of key names. Matching keys will be sorted in that order in the output JSON.
     *                   Keys not provided will be sorted after any provided keys, in numeric + lexicographical order.
     * @param replacePokemonNames - Defaults to true, replaces English pokemon names in the English text with the corresponding translation keys.
     */
    private static exportCachedTranslationDefaults(namespace: TranslationNamespace, keyOrder?: string[], replacePokemonNames = true) {
        if (!GameHelper.isDevelopmentBuild()) {
            throw new Error('The translation cache is only available by default in development builds. To cache translatable text in this game version, add "?translationCache=true" to the end of the URL and reload the game.');
        }
        if (!App.game) {
            throw new Error('Translations may not be properly cached before the game is running.');
        }
        if (!App.translation.cachedTranslationDefaults?.[namespace]) {
            throw new Error(`Could not find cache for translation namespace '${namespace}'`);
        }

        let exportTree = Object.create(null);
        const namespaceCache = { ...App.translation.cachedTranslationDefaults[namespace] };

        // modify default text if applicable
        if (replacePokemonNames) {
            Object.entries(namespaceCache).forEach(([key, defaultValue]) => {
                if (Array.isArray(defaultValue)) {
                    namespaceCache[key] = defaultValue.map(t => TranslationHelper.replacePokemonNames(t));
                } else {
                    namespaceCache[key] = TranslationHelper.replacePokemonNames(defaultValue);
                }
            });
        }

        // handle shared subkeys by dividing into a tree of objects
        Object.entries(namespaceCache).forEach(([key, defaultValue]) => {
            // split key on periods not adjacent to a space, to avoid breaking up a key's text
            const subkeys = key.split(/(?<! )\.(?! )/);
            let current = exportTree;
            // add to tree, creating new child objects if not yet present
            subkeys.forEach((subkey, i) => {
                if (i == subkeys.length - 1) {
                    // last key, add value as leaf
                    current[subkey] = defaultValue;
                } else {
                    // traverse to next child branch
                    if (!current[subkey]) {
                        current[subkey] = {};
                    }
                    current = current[subkey];
                }
            });
        });

        // Sorts keys by provided order, followed by any other keys in numeric + lexicographical order
        const keyOrderLookup = {};
        (keyOrder ?? []).forEach((key, i) => { keyOrderLookup[key] = i; });
        const compareKeys = (a: [string, unknown], b: [string, unknown]) => {
            const [key1] = a;
            const [key2] = b;
            const order1 = keyOrderLookup[key1];
            const order2 = keyOrderLookup[key2];
            if (order1 != undefined && order2 != undefined) {
                // Both strings have an explicit order
                return order1 - order2;
            } else if ((order1 ?? order2) != undefined) {
                // Sort explicitly-ordered strings before unknown strings
                return order1 != undefined ? -1 : 1;
            }
            // Neither key has a given order, compare based on strings
            let prefix = key1.match(/^(.*?)\d+$/)?.[1];
            if (prefix != undefined && key2.match(new RegExp(String.raw`^${prefix}\d+$`))) {
                // The keys' only difference is a numeric suffix, sort numerically
                return Number(key1.match(/step (\d+)/)[1]) - Number(key2.match(/step (\d+)/)[1]);
            }
            // Sort in string lexicographical order by default
            return key1 < key2 ? -1 : 1;
        };

        // Recursive function to simplify tree:
        // - sort keys by provided order
        // - condense tree by finding subkeys with a single child key and combining the two
        const recursiveSimplify = (obj) => {
            const simplifiedEntries = Object.entries(obj)
                .sort(compareKeys) // sort by this layer's keys before merging any child keys
                .map(entry => {
                    let [key, val] = entry;
                    while (typeof val == 'object' && !Array.isArray(val) && Object.keys(val).length == 1)  {
                        // If this entry contains an object with only one entry, merge the keys and remove the unnecessary layer
                        // i.e. { 'a': {'b': { 'c': 1, 'd': 2 } }} -> { 'a.b': { 'c': 1, 'd': 2 }}
                        const childKey = Object.keys(val)[0];
                        key = `${key}.${childKey}`;
                        val = val[childKey];
                    }
                    if (typeof val == 'object' && !Array.isArray(val)  && Object.keys(val).length) {
                        // simplify child objects
                        val = recursiveSimplify(val);
                    }
                    return [key, val];
                });
            // convert entry array back to object, now with keys sorted and combined as needed
            return Object.fromEntries(simplifiedEntries);
        };

        // Simplify, stringify, and download the exported translation tree
        exportTree = recursiveSimplify(exportTree);
        const outputFile = JSON.stringify(exportTree, null, 2);
        DownloadUtil.downloadTextFile(outputFile, `${namespace}.json`);
    }

    public static exportQuestlineTranslationDefaults(): void {
        // Make sure all questline translatable text has been loaded by App.translation
        App.game.quests.questLines().forEach(ql => {
            ql.displayName; // eslint-disable-line @typescript-eslint/no-unused-expressions
            ql.description; // eslint-disable-line @typescript-eslint/no-unused-expressions
            ql.quests().forEach(q => q.description);
        });

        const keyOrder = [...App.game.quests.questLines().map(ql => ql.name), 'displayName', 'description'];
        TranslationHelper.exportCachedTranslationDefaults('questlines', keyOrder);
    }
}
