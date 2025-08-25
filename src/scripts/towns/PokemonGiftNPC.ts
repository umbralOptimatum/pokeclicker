class PokemonGiftNPC extends GiftNPC {
    constructor(
        public readonly name: string,
        displayName: string,
        public dialog: string[],
        public giftPokemon: PokemonNameType,
        public giftImage?: string,
        options: NPCOptionalArgument = {}
    ) {
        const giftFunction = () => {
            App.game.party.gainPokemonByName(this.giftPokemon, PokemonFactory.generateShiny(GameConstants.SHINY_CHANCE_REWARD));
        };
        super(name, displayName, dialog, giftFunction, giftImage, options);
    }

    public areaStatus(): areaStatus[] {
        const status = [];
        if (!App.game.party.alreadyCaughtPokemonByName(this.giftPokemon)) {
            status.push(areaStatus.uncaughtPokemon);
        }
        if (!App.game.party.alreadyCaughtPokemonByName(this.giftPokemon, true)) {
            status.push(areaStatus.uncaughtShinyPokemon);
        }
        return status;
    }
}
