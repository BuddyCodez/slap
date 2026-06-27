import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
	ArrowRight,
	Copy,
	LucideIcon,
	RefreshCw,
	Shield,
	Sparkles,
	Trash2,
	Zap,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
	AppState,
	Dimensions,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import Animated, {
	Easing,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { OtpBottomSheet } from "@/components/auth/otp-bottom-sheet";
import { authClient } from "@/lib/auth-client";
import { client, queryClient } from "@/utils/orpc";

const { width: SCREEN_W } = Dimensions.get("window");

// Brutalist Pressable Button component with mechanical press physics
function BrutalistButton({
	onPress,
	label,
	variant = "primary",
	disabled = false,
	icon: Icon,
}: {
	onPress: () => void;
	label: string;
	variant?: "primary" | "secondary";
	disabled?: boolean;
	icon?: React.ComponentType<any>;
}) {
	const isPressed = useSharedValue(0);

	const animatedStyle = useAnimatedStyle(() => {
		const offset = isPressed.value * 6; // Shift depth (increased to 6 for a more 3D effect)
		return {
			transform: [{ translateX: offset }, { translateY: offset }],
			shadowOffset: {
				width: 6 - offset,
				height: 6 - offset,
			},
		};
	});

	return (
		<Pressable
			onPressIn={() => {
				if (disabled) return;
				void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
				isPressed.value = withTiming(1, { duration: 50 });
			}}
			onPressOut={() => {
				if (disabled) return;
				isPressed.value = withTiming(0, { duration: 50 });
			}}
			onPress={() => {
				if (!disabled) onPress();
			}}
			disabled={disabled}
			style={styles.brutalistBtnWrapper}
		>
			<Animated.View
				style={[
					styles.brutalistBtnBody,
					variant === "primary" ? styles.btnPrimary : styles.btnSecondary,
					disabled && styles.btnDisabled,
					animatedStyle,
				]}
			>
				{Icon && (
					<Icon
						size={18}
						strokeWidth={2.5}
						color={variant === "primary" ? "#000000" : "#FFFFFF"}
					/>
				)}
				<Text
					style={[
						styles.brutalistBtnText,
						variant === "primary" ? styles.textBlack : styles.textWhite,
					]}
				>
					{label}
				</Text>
			</Animated.View>
		</Pressable>
	);
}

export default function AuthScreen() {
	const { theme } = useUnistyles();
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [otp, setOtp] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [sheetVisible, setSheetVisible] = useState(false);

	const { data: session } = authClient.useSession();

	useEffect(() => {
		if (session) {
			router.replace("/(tabs)");
		}
	}, [session]);

	const loadingRef = useRef(loading);
	useEffect(() => {
		loadingRef.current = loading;
	}, [loading]);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (nextAppState) => {
			if (nextAppState === "active" && loadingRef.current) {
				// Wait 1.5 seconds for any deep links to process first
				setTimeout(async () => {
					try {
						const { data } = await authClient.getSession();
						if (!data && loadingRef.current) {
							setLoading(false);
							setEmail("");
							setUsername("");
							setOtp("");
							setError(null);
						}
					} catch (e) {
						if (loadingRef.current) {
							setLoading(false);
							setEmail("");
							setUsername("");
							setOtp("");
							setError(null);
						}
					}
				}, 1500);
			}
		});
		return () => subscription.remove();
	}, []);

	// Entrance scale for sticker cards
	const scale1 = useSharedValue(0);
	const scale2 = useSharedValue(0);
	const scale3 = useSharedValue(0);
	const scale4 = useSharedValue(0);

	// Marquee infinite ticker translation
	const tickerX = useSharedValue(0);

	useEffect(() => {
		// Fast spring entrance stagger for sticker cards
		scale1.value = withDelay(
			100,
			withSpring(1, { damping: 9, stiffness: 180 }),
		);
		scale2.value = withDelay(
			250,
			withSpring(1, { damping: 9, stiffness: 180 }),
		);
		scale3.value = withDelay(
			400,
			withSpring(1, { damping: 9, stiffness: 180 }),
		);
		scale4.value = withDelay(
			555,
			withSpring(1, { damping: 9, stiffness: 180 }),
		);

		// Infinite linear marquee translation
		tickerX.value = withRepeat(
			withTiming(-480, { duration: 10000, easing: Easing.linear }),
			-1,
			false,
		);
	}, []);

	// Animated styles for physical stickers (includes scale & rotation)
	const animCard1 = useAnimatedStyle(() => ({
		transform: [{ scale: scale1.value }, { rotate: "-7deg" }],
	}));

	const animCard2 = useAnimatedStyle(() => ({
		transform: [{ scale: scale2.value }, { rotate: "5deg" }],
	}));

	const animCard3 = useAnimatedStyle(() => ({
		transform: [{ scale: scale3.value }, { rotate: "-4deg" }],
	}));

	const animCard4 = useAnimatedStyle(() => ({
		transform: [{ scale: scale4.value }, { rotate: "9deg" }],
	}));

	const animTicker = useAnimatedStyle(() => ({
		transform: [{ translateX: tickerX.value }],
	}));

	const checkEmailExists = async (checkEmail: string): Promise<boolean> => {
		try {
			const res = await client.checkEmail({ email: checkEmail });
			return !!res.exists;
		} catch (e) {
			console.error("Error checking email status:", e);
			return false;
		}
	};

	const sendOtp = async (): Promise<boolean> => {
		if (!email.trim() || loading) return false;
		setLoading(true);
		setError(null);

		try {
			const { data, error: err } =
				await authClient.emailOtp.sendVerificationOtp({
					email: email.trim(),
					type: "sign-in",
				});

			if (err) {
				setError(err.message ?? "Could not send code");
				setLoading(false);
				return false;
			}
			setLoading(false);
			return true;
		} catch (e) {
			setError("An unexpected error occurred");
			setLoading(false);
			return false;
		}
	};

	const verifyOtp = async () => {
		if (!otp.trim() || loading) return;
		setLoading(true);
		setError(null);

		try {
			const { data, error: err } = await authClient.signIn.emailOtp({
				email: email.trim(),
				otp: otp.trim(),
			});

			if (err) {
				setError(err.message ?? "Invalid code");
				setLoading(false);
			} else {
				if (username.trim()) {
					try {
						await client.profile.update({
							username: username.trim(),
							name: username.trim(),
						});
					} catch (profileErr) {
						console.error("Failed to update profile username:", profileErr);
					}
				}
				void Haptics.notificationAsync(
					Haptics.NotificationFeedbackType.Success,
				);
				setError(null);
				setLoading(false);
				queryClient.invalidateQueries();
				router.replace("/(tabs)");
			}
		} catch (e) {
			setError("An unexpected error occurred");
			setLoading(false);
		}
	};

	const signInWithDiscord = async () => {
		if (loading) return;
		setLoading(true);
		setError(null);

		await authClient.signIn.social(
			{ provider: "discord", callbackURL: "/(tabs)" },
			{
				onError: (result) => {
					setError(result.error.message ?? "Discord sign-in failed");
				},
				onSettled: () => setLoading(false),
			},
		);
	};

	const tickerText =
		"WHATSAPP EXPORT ⚡ INSTAGRAM READY ⚡ CROSS-PLATFORM ⚡ NO SILOS ⚡ ";

	return (
		<View style={styles.root}>
			<ScrollView
				contentContainerStyle={styles.scrollContainer}
				showsVerticalScrollIndicator={false}
			>
				{/* Top Poster Header */}
				<View style={styles.header}>
					<View style={styles.logoRow}>
						<Text style={styles.logoText}>SLAP</Text>
						<View style={styles.cyberBadge}>
							<Text style={styles.cyberBadgeText}>V1</Text>
						</View>
					</View>
					<Text style={styles.heading}>UPLOAD. DISCOVER. GRAB. SLAP.</Text>
				</View>

				{/* Messy Tactile Sticker Bomb Showcase */}
				<View style={styles.stickerBombArea}>
					{/* Sticker 1 */}
					<Animated.View
						style={[
							styles.stickerCard,
							styles.cardYellow,
							styles.sticker1,
							animCard1,
						]}
					>
						<Text style={styles.stickerTitle}>ANGRY CATS 😾</Text>
						<Text style={styles.stickerMeta}>24 PACK</Text>
					</Animated.View>

					{/* Sticker 2 */}
					<Animated.View
						style={[
							styles.stickerCard,
							styles.cardWhite,
							styles.sticker2,
							animCard2,
						]}
					>
						<Text style={styles.stickerTitle}>MEMES 🇮🇳</Text>
						<Text style={styles.stickerMeta}>18 PACK</Text>
					</Animated.View>

					{/* Sticker 3 */}
					<Animated.View
						style={[
							styles.stickerCard,
							styles.cardGreen,
							styles.sticker3,
							animCard3,
						]}
					>
						<Text style={styles.stickerTitle}>ANIME RX 🎌</Text>
						<Text style={styles.stickerMeta}>32 PACK</Text>
					</Animated.View>

					{/* Sticker 4 */}
					<Animated.View
						style={[
							styles.stickerCard,
							styles.cardRed,
							styles.sticker4,
							animCard4,
						]}
					>
						<Text style={styles.stickerTitle}>CHAOS VAULT 💀</Text>
						<Text style={styles.stickerMeta}>45 PACK</Text>
					</Animated.View>
				</View>

				{/* Continuous Infinite Marquee Ticker */}
				<View style={styles.tickerContainer}>
					<Animated.View style={[styles.tickerRow, animTicker]}>
						<Text numberOfLines={1} style={styles.tickerText}>
							{tickerText + tickerText + tickerText}
						</Text>
					</Animated.View>
				</View>
			</ScrollView>

			{/* Sticky Bottom Actions Container */}
			<View style={styles.bottomContainer}>
				{/* Social Proof */}
				<View style={styles.socialProof}>
					<Text style={styles.socialProofText}>
						USED IN WHATSAPP, DISCORD & INSTA • 10K+ SAVED TODAY
					</Text>
				</View>

				{error && !sheetVisible ? (
					<View style={styles.errorRow}>
						<Text style={styles.errorText}>{error}</Text>
					</View>
				) : null}

				{/* Primary Cyber-Yellow CTA */}
				<BrutalistButton
					label={loading && !sheetVisible ? "WORKING..." : "GET STARTED"}
					onPress={() => {
						setSheetVisible(true);
					}}
					variant="primary"
					disabled={loading && !sheetVisible}
				/>

				{/* Secondary stark white/obsidian Discord CTA */}
				<BrutalistButton
					label="CONTINUE WITH DISCORD"
					onPress={signInWithDiscord}
					variant="secondary"
					disabled={loading && !sheetVisible}
				/>

				<Text style={styles.legal}>
					BY CONTINUING, YOU AGREE TO OUR{" "}
					<Text style={styles.legalLink}>TERMS</Text> AND{" "}
					<Text style={styles.legalLink}>PRIVACY POLICY</Text>
				</Text>
			</View>

			{/* Neo-Brutalist OTP bottom sheet */}
			<OtpBottomSheet
				visible={sheetVisible}
				onClose={() => {
					setSheetVisible(false);
					setError(null);
					setEmail("");
					setUsername("");
					setOtp("");
				}}
				email={email}
				onChangeEmail={setEmail}
				username={username}
				onChangeUsername={setUsername}
				otp={otp}
				onChangeOtp={setOtp}
				onSendOtp={sendOtp}
				onVerifyOtp={verifyOtp}
				loading={loading}
				error={sheetVisible ? error : null}
				setError={setError}
				checkEmailExists={checkEmailExists}
			/>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	root: {
		flex: 1,
		backgroundColor: "#0A0A0A", // Raw industrial dark grey
	},
	scrollContainer: {
		flexGrow: 1,
		justifyContent: "flex-start", // Centered hero content!
		alignItems: "center",
		paddingHorizontal: theme.spacing.lg,
		paddingTop: 40,
		paddingBottom: 20,
	},
	header: {
		alignItems: "flex-start", // Centered logo/heading
		marginBottom: theme.spacing.md,
	},
	logoRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		marginBottom: theme.spacing.xs,
	},
	logoText: {
		color: "#FFFFFF",
		fontSize: theme.fontSize.lg,
		fontWeight: "900",
		fontStyle: "italic",
		letterSpacing: 1.5,
	},
	cyberBadge: {
		backgroundColor: "#FFF500", // Cyber-Yellow badge
		paddingHorizontal: 6,
		paddingVertical: 2,
	},
	cyberBadgeText: {
		color: "#000000",
		fontSize: 10,
		fontWeight: "900",
	},
	heading: {
		color: "#FFF500", // Cyber-Yellow tagline
		fontSize: 28, // Loud bold Gen-Z font
		fontWeight: "900",
		letterSpacing: -0.5,
		marginTop: theme.spacing.xs,
		lineHeight: 34,
		textAlign: "center", // Centered tagline
	},
	stickerBombArea: {
		height: 240,
		width: "100%",
		marginVertical: theme.spacing.md,
		position: "relative",
		justifyContent: "center",
		alignItems: "center",
	},
	stickerCard: {
		position: "absolute",
		borderWidth: 3,
		borderColor: "#000000",
		borderRadius: 4, // Sharp corners
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		minWidth: 160,
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		shadowOffset: { width: 8, height: 8 }, // Hard zero-blur drop shadow (increased to 8 for a more 3D look)
		elevation: 8,
	},
	cardYellow: {
		backgroundColor: "#FFF500",
	},
	cardWhite: {
		backgroundColor: "#FFFFFF",
	},
	cardGreen: {
		backgroundColor: "#00FF66",
	},
	cardRed: {
		backgroundColor: "#FF3333",
	},
	sticker1: {
		top: 10,
		left: 15,
	},
	sticker2: {
		top: 30,
		right: 15,
	},
	sticker3: {
		bottom: 30,
		left: 10,
	},
	sticker4: {
		bottom: 15,
		right: 20,
	},
	stickerTitle: {
		color: "#000000",
		fontSize: theme.fontSize.sm,
		fontWeight: "900",
		letterSpacing: -0.2,
	},
	stickerMeta: {
		color: "#000000",
		fontSize: 10,
		fontWeight: "900",
		opacity: 0.8,
		marginTop: 2,
	},
	tickerContainer: {
		backgroundColor: "#FFF500", // Solid Cyber-Yellow background
		borderTopWidth: 3,
		borderBottomWidth: 3,
		borderColor: "#000000",
		paddingVertical: 12,
		transform: [{ rotate: "-2.5deg" }, { scale: 1.05 }], // Angled and scaled to pop
		marginVertical: theme.spacing.md + 6,
		overflow: "hidden",
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		shadowOffset: { width: 4, height: 4 },
		elevation: 5,
	},
	tickerRow: {
		flexDirection: "row",
		width: 1000,
	},
	tickerText: {
		color: "#000000", // Black text on yellow background
		fontSize: 12,
		fontWeight: "900",
		letterSpacing: 1.8,
	},
	socialProof: {
		alignItems: "center",
		marginVertical: theme.spacing.sm,
	},
	socialProofText: {
		color: "#A3A3B3",
		fontSize: 11,
		fontWeight: "900",
		letterSpacing: 0.5,
		textAlign: "center",
	},
	actions: {
		marginTop: theme.spacing.md,
		gap: theme.spacing.md,
	},
	errorRow: {
		backgroundColor: "#FF3333",
		borderWidth: 3,
		borderColor: "#000000",
		borderRadius: 4,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
	},
	errorText: {
		color: "#FFFFFF",
		fontSize: theme.fontSize.sm,
		fontWeight: "900",
	},
	bottomContainer: {
		backgroundColor: "#0A0A0A",
		paddingHorizontal: theme.spacing.lg,
		paddingBottom: 40,
		paddingTop: 16,
		gap: theme.spacing.md,
		borderTopWidth: 2,
		borderColor: "#121212",
	},
	brutalistBtnWrapper: {
		position: "relative",
		height: 54,
	},
	brutalistBtnBody: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		borderWidth: 3,
		borderColor: "#000000",
		borderRadius: 4,
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		shadowOffset: { width: 6, height: 6 }, // Increased to 6 for a more 3D effect
		elevation: 6,
	},
	btnPrimary: {
		backgroundColor: "#FFF500", // Cyber-Yellow
	},
	btnSecondary: {
		backgroundColor: "#1A1A1A", // Dark Obsidian
	},
	btnDisabled: {
		opacity: 0.55,
	},
	brutalistBtnText: {
		fontSize: theme.fontSize.base,
		fontWeight: "900",
		letterSpacing: 0.5,
	},
	textBlack: {
		color: "#000000",
	},
	textWhite: {
		color: "#FFFFFF",
	},
	legal: {
		color: "#A3A3B3",
		fontSize: 10,
		textAlign: "center",
		lineHeight: 14,
		marginTop: theme.spacing.xs,
		fontWeight: "900",
	},
	legalLink: {
		color: "#FFF500",
		textDecorationLine: "underline",
	},
}));
