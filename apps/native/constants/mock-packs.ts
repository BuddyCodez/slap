export type MockPack = {
	id: string;
	name: string;
	emoji: string;
	creator: {
		name: string;
		avatar: string;
	};
	downloads: number;
	saves: number;
	height: number;
	rotation: number;
	category: string;
};

export const categories = [
	{ id: "reactions", label: "Reactions", emoji: "😂" },
	{ id: "memes", label: "Memes", emoji: "🔥" },
	{ id: "anime", label: "Anime", emoji: "🎌" },
	{ id: "desi", label: "Desi", emoji: "🇮🇳" },
	{ id: "animals", label: "Animals", emoji: "🐱" },
	{ id: "aesthetic", label: "Aesthetic", emoji: "✨" },
] as const;

export const trendingPacks: MockPack[] = [
	{
		id: "1",
		name: "Chaos Cat",
		emoji: "😼",
		creator: { name: "buddy", avatar: "🧑‍🎤" },
		downloads: 18420,
		saves: 3200,
		height: 148,
		rotation: -3,
		category: "animals",
	},
	{
		id: "2",
		name: "Desi Reacts",
		emoji: "🇮🇳",
		creator: { name: "meme_lord", avatar: "😎" },
		downloads: 15200,
		saves: 2800,
		height: 132,
		rotation: 2,
		category: "desi",
	},
	{
		id: "3",
		name: "Anime Rage",
		emoji: "💢",
		creator: { name: "otaku", avatar: "🎌" },
		downloads: 12100,
		saves: 2100,
		height: 156,
		rotation: -2,
		category: "anime",
	},
	{
		id: "4",
		name: "Main Character",
		emoji: "✨",
		creator: { name: "vibes", avatar: "🌟" },
		downloads: 9800,
		saves: 1900,
		height: 140,
		rotation: 4,
		category: "aesthetic",
	},
];

export const gridPacks: MockPack[] = [
	...trendingPacks,
	{
		id: "5",
		name: "Crying Laugh",
		emoji: "😭",
		creator: { name: "lol", avatar: "🤣" },
		downloads: 7600,
		saves: 1200,
		height: 168,
		rotation: -4,
		category: "reactions",
	},
	{
		id: "6",
		name: "Sigma Stare",
		emoji: "🗿",
		creator: { name: "based", avatar: "💀" },
		downloads: 6900,
		saves: 980,
		height: 124,
		rotation: 3,
		category: "memes",
	},
	{
		id: "7",
		name: "Pookie Pack",
		emoji: "🥺",
		creator: { name: "softie", avatar: "💕" },
		downloads: 5400,
		saves: 860,
		height: 152,
		rotation: -1,
		category: "reactions",
	},
	{
		id: "8",
		name: "Chai & Chaos",
		emoji: "☕",
		creator: { name: "desi", avatar: "🇮🇳" },
		downloads: 4800,
		saves: 720,
		height: 136,
		rotation: 2,
		category: "desi",
	},
	{
		id: "9",
		name: "Glitch Core",
		emoji: "👾",
		creator: { name: "pixel", avatar: "🕹️" },
		downloads: 4100,
		saves: 640,
		height: 160,
		rotation: -3,
		category: "aesthetic",
	},
];
