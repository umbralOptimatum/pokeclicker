export type TranslationOutput = string | string[];
export type StaticTranslationOutput = TranslationOutput | Record<string, TranslationOutput>;

type PropertiesObj = Readonly<{ [key: string]: string, [key: number | symbol]: never }>;
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

export default function translatable<const InstanceProperties extends MaybeProperties, const StaticProperties extends MaybeProperties>(
    namespace: TranslationNamespace, properties?: InstanceProperties, staticProperties?: StaticProperties, hashed = true
) {
    return <TClass extends Translatable<ExtractKeys<InstanceProperties>, ExtractKeys<StaticProperties>>>(_constructor: TClass): void => {
        if (App.translation.GetTranslationOutputType) {
            // TODO implement
            // TODO trim leading underscores
        }
    };
}