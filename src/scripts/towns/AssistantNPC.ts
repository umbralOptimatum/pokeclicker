@translatable('npcs', ['listingDialog'])
class AssistantNPC extends NPC {

    constructor(
        public readonly name: string,
        displayName: string,
        public dialog: string[],
        public listingDialog: string[],
        public assistantType: string,
        image: string = undefined,
        requirement?: Requirement | MultiRequirement | OneFromManyRequirement
    ) {
        super(name, displayName, dialog, {image: image, requirement: requirement});
    }

    get dialogHTML(): string {
        const filterPokemonList = () => {
            switch (this.assistantType) {
                case 'baby':
                    return App.game.party.caughtPokemon.filter(p =>
                        pokemonBabyPrevolutionMap[p.name] &&
                        player.highestRegion() >= pokemonMap[pokemonBabyPrevolutionMap[p.name]].nativeRegion &&
                        !App.game.party.caughtPokemon.some(e => e.name === pokemonBabyPrevolutionMap[p.name])
                    );
                case 'evolution':
                    return App.game.party.caughtPokemon.filter(p => p.evolutions?.some(e =>
                        e.trigger !== EvoTrigger.NONE &&
                        !App.game.party.caughtPokemon.some(p => p.name === e.evolvedPokemon) &&
                        player.highestRegion() >= pokemonMap[e.evolvedPokemon].nativeRegion &&
                        Math.floor(pokemonMap[e.basePokemon].id) != Math.floor(pokemonMap[e.evolvedPokemon].id)
                    ));
                default:
                    return [];
            }
        };
        const pokemonList = filterPokemonList().sort((a,b) => a.id - b.id);

        // If list, lead into it with dialog
        let leadingDialog = '';
        if (pokemonList.length) {
            leadingDialog = NPC.translateDialog(`${this.translationKey}.listingDialog`, this.listingDialog);
        }

        const imageListHTML = pokemonList.map(p => `<img width="72" src="assets/images/pokemon/${p.id}.png" />`).join('');

        return super.dialogHTML + leadingDialog + imageListHTML;
    }
}
