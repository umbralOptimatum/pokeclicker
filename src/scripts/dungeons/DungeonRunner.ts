class DungeonRunner {

    public static dungeon: Dungeon;
    public static timeLeft: KnockoutObservable<number> = ko.observable(GameConstants.DUNGEON_TIME);
    public static timeLeftPercentage: KnockoutObservable<number> = ko.observable(100);

    public static fighting: KnockoutObservable<boolean> = ko.observable(false);
    public static map: DungeonMap;
    public static pokemonDefeated: number;
    public static chestsOpened: number;
    public static loot: string[];
    public static currentTileType;
    public static fightingBoss: KnockoutObservable<boolean> = ko.observable(false);

    public static initializeDungeon(dungeon) {
        if (!dungeon.isUnlocked()) {
            return false;
        }

        DungeonRunner.dungeon = dungeon;
        DungeonRunner.timeLeft(GameConstants.DUNGEON_TIME);
        DungeonRunner.map = new DungeonMap(GameConstants.DUNGEON_SIZE);
        DungeonRunner.pokemonDefeated = 0;
        DungeonRunner.chestsOpened = 0;
        DungeonRunner.loot = [];
        DungeonRunner.currentTileType = ko.computed(function () {
            return DungeonRunner.map.currentTile().type;
        });
        DungeonRunner.fightingBoss(false);
        Game.gameState(GameConstants.GameState.dungeon);
    }

    public static tick() {
        if (this.timeLeft() < 0) {
            this.dungeonLost();
        }
        this.timeLeft(this.timeLeft() - GameConstants.DUNGEON_TICK);
        this.timeLeftPercentage(Math.floor(this.timeLeft() / GameConstants.DUNGEON_TIME * 100))
    }

    public static openChest() {
        if (DungeonRunner.map.currentTile().type() !== GameConstants.DungeonTile.chest) {
            return;
        }

        DungeonRunner.chestsOpened++;
        DungeonRunner.map.currentTile().type(GameConstants.DungeonTile.empty);
        DungeonRunner.map.currentTile().calculateCssClass();
        // TODO add loot
        if (DungeonRunner.chestsOpened == GameConstants.DUNGEON_CHEST_SHOW) {
            DungeonRunner.map.showChestTiles();
        }
        if (DungeonRunner.chestsOpened == GameConstants.DUNGEON_MAP_SHOW) {
            DungeonRunner.map.showAllTiles();
        }
    }

    public static startBossFight() {
        if (DungeonRunner.map.currentTile().type() !== GameConstants.DungeonTile.boss || DungeonRunner.fightingBoss()) {
            return;
        }

        DungeonRunner.fightingBoss(true);
        DungeonBattle.generateNewBoss();
    }


    private static dungeonLost() {
        Game.gameState(GameConstants.GameState.town);
        console.log("You lost... loser!");
    }

    public static dungeonWon() {
        Game.gameState(GameConstants.GameState.town);
        // TODO award loot with a special screen
        console.log("You won... winner!");
    }

    public static timeLeftSeconds = ko.computed(function () {
        return (Math.ceil(DungeonRunner.timeLeft() / 10) / 10).toFixed(1);
    })


}