@translatable('npcs', null, ['specialDialog'])
class RoamerNPC extends NPC {
    static readonly specialDialog: Record<string, TranslationOutput> = {
        'special.RoamerNPC.noRoamers': 'There haven\'t been any reports of roaming Pokémon around {{ subRegionGroup }} lately.',
    }

    constructor(
        public readonly name: string,
        displayName: string,
        public dialog: string[],
        public region: GameConstants.Region,
        public subRegionRoamerGroup: number,
        image: string = undefined,
        requirement?: Requirement | MultiRequirement | OneFromManyRequirement
    ) {
        super(name, displayName, dialog, {image: image, requirement: requirement});
    }

    get dialogHTML(): string {
        const route = RoamingPokemonList.getIncreasedChanceRouteBySubRegionGroup(this.region, this.subRegionRoamerGroup);
        const roamers = RoamingPokemonList.getSubRegionalGroupRoamers(this.region, this.subRegionRoamerGroup);

        // If no roaming Pokemon yet
        if (!roamers.length) {
            const regionName = RoamingPokemonList.roamerGroups[this.region]?.[this.subRegionRoamerGroup]?.name
                ?? GameConstants.camelCaseToString(GameConstants.Region[this.region]);
            return NPC.translateDialog('special.RoamerNPC.noRoamers', RoamerNPC.specialDialog['special.RoamerNPC.noRoamers'], { subRegionGroup: regionName });
        }

        roamers.forEach((roamer) => {
            if (App.game.statistics.pokemonEncountered[roamer.pokemon.id]() === 0 && App.game.statistics.pokemonSeen[roamer.pokemon.id]() === 0) {
                GameHelper.incrementObservable(App.game.statistics.pokemonSeen[roamer.pokemon.id]);
            }
        });

        const roamersHTML = roamers.map(r => `<img class="npc-roamer-image" src="assets/images/pokemon/${r.pokemon.id}.png" />`).join('');

        return NPC.translateDialog(`${this.translationKey}.dialog`, this.dialog, { routeName: route()?.routeName ?? 'Unknown Route'}) + roamersHTML;
    }
}
