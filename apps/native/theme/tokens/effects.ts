import { palette } from "./colors";

export const borderRadius = {
	xs: 4,
	sm: 6,
	md: 8,
	lg: 10,
	xl: 12,
	xxl: 16,
	pill: 999,
} as const;

export const shadows = {
	sticker: {
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 6,
		elevation: 3,
	},
	glow: {
		shadowColor: palette.yellow,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.15,
		shadowRadius: 10,
		elevation: 4,
	},
} as const;
