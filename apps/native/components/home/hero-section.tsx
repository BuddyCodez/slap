import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { authClient } from "@/lib/auth-client";
import { formatCount } from "@/utils/format";

type HeroSectionProps = {
	slapCount?: number;
};

export function HeroSection({ slapCount = 12_432 }: HeroSectionProps) {
	const { data: session } = authClient.useSession();
	const name = session?.user?.name || "user";

	return (
		<View style={styles.wrap}>
			<Text style={styles.greeting}>HEY, @{name.toUpperCase()}</Text>
			<Text style={styles.sub}>YOUR STICKER ARCHIVE. EVERYWHERE.</Text>

			{/* Industrial clout banner with hard shadow */}
			<View style={styles.bannerWrap}>
				<View style={styles.bannerShadow} />
				<View style={styles.banner}>
					<Text style={styles.bannerText}>
						⚡ CLOUT CHECK: {formatCount(slapCount).toUpperCase()}+ SLAPPED
						TODAY
					</Text>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	wrap: {
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing.xl,
		paddingBottom: theme.spacing.md,
	},
	greeting: {
		color: "#FFFFFF",
		fontSize: 30,
		fontWeight: "900",
		letterSpacing: -1,
	},
	sub: {
		color: "#FFF500",
		fontSize: 12,
		fontWeight: "900",
		letterSpacing: 1,
		marginTop: 4,
	},
	bannerWrap: {
		marginTop: theme.spacing.lg,
		position: "relative",
	},
	bannerShadow: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "#FFF500",
		borderRadius: 0,
		transform: [{ translateX: -3 }, { translateY: 3 }],
	},
	banner: {
		backgroundColor: "#000000",
		borderWidth: 3,
		borderColor: "#FFF500",
		borderRadius: 0,
		paddingVertical: 14,
		paddingHorizontal: 16,
	},
	bannerText: {
		color: "#FFF500",
		fontSize: 13,
		fontWeight: "900",
		letterSpacing: 1,
		textAlign: "center",
	},
}));
