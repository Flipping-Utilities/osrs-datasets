export interface Item {
    // The item id
    id: number;
    // Item name
    name: string;
    // Image url
    image: string;
    // Examine text
    examine: string;
    // Can this item be traded between players
    isTradeable: boolean;
    // Is this item listed on the GE
    isOnGrandExchange: boolean;
    // Is this item members, f2p or unknown
    isMembers: boolean | null;
    // Items directly related to this item: Charged variants, potion doses
    relatedItems: number[];
    // Can this item stacked
    isStackable: boolean;
    // Can this item be equiped
    isEquipable: boolean;
    // OSRS Cost: used to compute the other values such as alch
    value: number;
    // Can this item be high alched
    isAlchable: boolean;
    // // Low alch value
    // lowalch: number;
    // // High alch value
    // highalch: number;
    // Available left click options
    options: string[];
    // Can this item be dropped, or does it have a special action like "Destroy"
    drop: string;
    // Weight when carried
    weight: number;
}

// {{Infobox Item\n|defver = 4\n|version1 = 1 dose\n|version2 = 2 dose\n|version3 = 3 dose\n|version4 = 4 dose\n|smwname1 = (1)\n|smwname2 = (2)\n|smwname3 = (3)\n|smwname4 = (4)\n|name1 = Twisted potion (1)\n|name2 = Twisted potion (2)\n|name3 = Twisted potion (3)\n|name4 = Twisted potion (4)\n|image1 = [[File:Twisted potion (1).png]]\n|image2 = [[File:Twisted potion (2).png]]\n|image3 = [[File:Twisted potion (3).png]]\n|image4 = [[File:Twisted potion (4).png]]\n|release = [[5 January]] [[2017]]\n|update = Chambers of Xeric\n|members = Yes\n|quest = No\n|tradeable = Yes\n|placeholder = No\n|equipable = No\n|stackable = No\n|noteable = No\n|options = Drink\n|destroy = Drop\n|examine = The potion blends the dexterity and devastation of Xeric's twisted archers. It was mixed reasonably well.\n|value = 40\n|weight = 0.020\n|id1 = 20929\n|id2 = 20930\n|id3 = 20931\n|id4 = 20932\n}}