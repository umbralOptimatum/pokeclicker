import type { TranslationNamespace } from './Translation';

export type TranslationOutput = string | string[];
export type StaticTranslationOutput = TranslationOutput | Record<string, TranslationOutput>;

type MaybeProperties = undefined | null | ReadonlyArray<string>;

type ExtractKeys<P extends MaybeProperties> = P extends ReadonlyArray<infer S extends string> ? S : null;
type PropertiesIfKeys<MaybeProps extends MaybeProperties, Output> = ExtractKeys<MaybeProps> extends string ? { [Property in ExtractKeys<MaybeProps>]: Output } : {};

type TranslatableClass<StaticProps extends MaybeProperties> = PropertiesIfKeys<StaticProps, StaticTranslationOutput>;
type TranslatableInstance<InstanceProps extends MaybeProperties> = PropertiesIfKeys<InstanceProps, TranslationOutput> & { translationKey: string | null };
type TranslatableInstanceConstructor<InstanceProps extends MaybeProperties> = { new (...args: any[]): TranslatableInstance<InstanceProps> };

type Translatable<InstanceProps extends MaybeProperties, StaticProps extends MaybeProperties> = TranslatableClass<StaticProps> & TranslatableInstanceConstructor<InstanceProps>;

export default function translatable<const InstanceProperties extends MaybeProperties, const StaticProperties extends MaybeProperties>(
    namespace: TranslationNamespace, properties?: InstanceProperties, staticProperties?: StaticProperties, hashed = true
) {
    return <TClass extends Translatable<InstanceProperties, StaticProperties>>(_constructor: TClass): void => {
        if (App.translation.GetTranslationOutputType) {
            // TODO
        }
    };
}