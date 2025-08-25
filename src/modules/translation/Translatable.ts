export type TranslationOutput = string | string[];
export type StaticTranslationOutput = TranslationOutput | Record<string, TranslationOutput>;

type PropertyOptions = { name: string, hashed?: boolean }
type PropertiesObj = Readonly<{ [key: string]: string | PropertyOptions, [key: number | symbol]: never }>;
type MaybeProperties = undefined | null | ReadonlyArray<string> | PropertiesObj;
type MaybeKeys = string | null;

type ExtractKeys<P extends MaybeProperties> = P extends ReadonlyArray<infer S extends string> ? S :
    P extends PropertiesObj ? Exclude<keyof P, number | symbol> : null;

type TranslatableClass<StaticKeys extends string> = Record<StaticKeys, StaticTranslationOutput>;
type TranslatableInstance<InstanceKeys extends string> = Record<InstanceKeys, TranslationOutput> & { translationKey: string | null };
type TranslatableInstanceConstructor<InstanceKeys extends string> = { new (...args: any[]): TranslatableInstance<InstanceKeys> };

type Translatable<InstanceKeys extends MaybeKeys, StaticKeys extends MaybeKeys> =
    (InstanceKeys extends string ? TranslatableInstanceConstructor<InstanceKeys> : {})
    & (StaticKeys extends string ? TranslatableClass<StaticKeys> : {});

/**
 * Registers a class's translatable text properties so that the default English can be automatically exported.
 * 
 * Properties can be provided in one of two forms:
 * - a readonly string array of property names, which will be used in the translation key as is
 * - an object with string keys corresponding to property names:
 *   - a string value will be used for the translation key
 *   - an object of type PropertyOptions
 *     - name: a string to use for the translation key
 *     - hash: a boolean to specify whether to use a hash in this translation key
 * 
 * Translation keys are of form {base key}.{property}?.{optional hash}
 * - base key:
 *   - For instance properties, given by this.translationKey
 *   - For static properties with string values, the class name
 * - property: the property name, or a corresponding output name if given
 * - optional hash: unless disabled for individual properties, a hash of the default text; see App.translation.getHashed()
 * 
 * @param namespace: The translation namespace to use
 * @param properties: Instance properties to register
 * @param staticProperties: Static class properties to register
 * 
 * If neither properties nor staticProperties is given, the decorator will throw an exception.
 */
export default function translatable<const InstanceProperties extends MaybeProperties, const StaticProperties extends MaybeProperties>(
    namespace: TranslationNamespace, properties?: InstanceProperties, staticProperties?: StaticProperties
) {
    return <TClass extends Translatable<ExtractKeys<InstanceProperties>, ExtractKeys<StaticProperties>>>(_constructor: TClass): void => {
        if (App.translation.GetTranslationOutputType) {
            // TODO implement
            // TODO trim leading underscores
            // TODO make hashing an individual thing
            // TODO decide whether to bother supporting static multi-key objects now that alternate names are supported more generally
        }
    };
}