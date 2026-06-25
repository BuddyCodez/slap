import { palette } from "./tokens/colors";
import { borderRadius, shadows } from "./tokens/effects";
import { fontFamily, fontSize, fontWeight } from "./tokens/typography";
import { spacing } from "./tokens/spacing";

export const slapTheme = {
	colors: {
		background: palette.background,
		foreground: palette.foreground,
		muted: palette.foregroundMuted,
		primary: palette.yellow,
		primaryForeground: palette.background,
		secondary: palette.purple,
		secondaryForeground: palette.foreground,
		accent: palette.mint,
		surface: palette.surface,
		surfaceElevated: palette.surfaceElevated,
		glass: palette.glass,
		glassBorder: palette.glassBorder,
		border: palette.border,
		borderSubtle: palette.borderSubtle,
		borderFocus: palette.borderFocus,
		destructive: palette.coral,
		lemon: palette.yellow,
		yellowGlow: "rgba(255, 214, 10, 0.15)",
		typography: palette.foreground,
		card: palette.surface,
		cardForeground: palette.foreground,
		mutedForeground: palette.foregroundMuted,
		input: palette.surfaceElevated,
		ring: palette.purple,
		success: palette.mint,
		destructiveForeground: palette.foreground,
		warning: palette.yellow,
		info: palette.purple,
		accentForeground: palette.background,
	},
	spacing,
	borderRadius,
	fontSize,
	fontWeight,
	fontFamily,
	shadows,
} as const;

export type SlapTheme = typeof slapTheme;
