import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
	Dimensions,
	Keyboard,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	Extrapolate,
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const { height: SCREEN_H } = Dimensions.get("window");
const OTP_LENGTH = 6;

// Brutalist Sheet Action Button component with mechanical press physics
function BrutalistSheetButton({
	onPress,
	label,
	disabled = false,
}: {
	onPress: () => void;
	label: string;
	disabled?: boolean;
}) {
	const isPressed = useSharedValue(0);

	const animatedStyle = useAnimatedStyle(() => {
		const offset = isPressed.value * 4;
		return {
			transform: [
				{ translateX: offset },
				{ translateY: offset },
			],
			shadowOffset: {
				width: 4 - offset,
				height: 4 - offset,
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
					disabled && styles.btnDisabled,
					animatedStyle,
				]}
			>
				<Text style={styles.brutalistBtnText}>{label}</Text>
			</Animated.View>
		</Pressable>
	);
}

type OtpSheetProps = {
	visible: boolean;
	onClose: () => void;
	email: string;
	onChangeEmail: (v: string) => void;
	username: string;
	onChangeUsername: (v: string) => void;
	otp: string;
	onChangeOtp: (v: string) => void;
	onSendOtp: () => Promise<boolean>;
	onVerifyOtp: () => Promise<void>;
	loading: boolean;
	error: string | null;
	setError: (err: string | null) => void;
	checkEmailExists: (email: string) => Promise<boolean>;
};

export function OtpBottomSheet({
	visible,
	onClose,
	email,
	onChangeEmail,
	username,
	onChangeUsername,
	otp,
	onChangeOtp,
	onSendOtp,
	onVerifyOtp,
	loading,
	error,
	setError,
	checkEmailExists,
}: OtpSheetProps) {
	const { theme } = useUnistyles();
	const translateY = useSharedValue(SCREEN_H);
	const [step, setStep] = useState<"email" | "username" | "otp">("email");
	const [resendTimer, setResendTimer] = useState(30);
	const [loadingLocal, setLoadingLocal] = useState(false);

	const emailInputRef = useRef<TextInput>(null);
	const usernameInputRef = useRef<TextInput>(null);
	const otpInputRef = useRef<TextInput>(null);

	// Resend countdown timer
	useEffect(() => {
		let interval: NodeJS.Timeout | null = null;
		if (step === "otp" && resendTimer > 0) {
			interval = setInterval(() => {
				setResendTimer((prev) => prev - 1);
			}, 1000);
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [step, resendTimer]);

	useEffect(() => {
		if (visible) {
			setStep("email");
			setResendTimer(30);
			translateY.value = withTiming(0, { duration: 300 });
			const timer = setTimeout(() => emailInputRef.current?.focus(), 350);
			return () => clearTimeout(timer);
		} else {
			Keyboard.dismiss();
			translateY.value = withTiming(SCREEN_H, { duration: 250 });
		}
	}, [visible, translateY]);

	const panGesture = Gesture.Pan()
		.onChange((event) => {
			translateY.value = Math.max(0, event.translationY);
		})
		.onEnd((event) => {
			if (event.translationY > 150 || event.velocityY > 500) {
				translateY.value = withTiming(
					SCREEN_H,
					{ duration: 220 },
					(finished) => {
						if (finished) runOnJS(onClose)();
					},
				);
			} else {
				translateY.value = withTiming(0, { duration: 200 });
			}
		});

	const sheetStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	const scrimStyle = useAnimatedStyle(() => ({
		opacity: interpolate(
			translateY.value,
			[0, SCREEN_H * 0.8],
			[1, 0],
			Extrapolate.CLAMP,
		),
	}));

	const handleEmailSubmit = async () => {
		if (!email.trim() || loading || loadingLocal) return;
		setError(null);
		setLoadingLocal(true);
		
		try {
			const exists = await checkEmailExists(email.trim());
			setLoadingLocal(false);
			
			if (exists) {
				const success = await onSendOtp();
				if (success) {
					setStep("otp");
					setResendTimer(30);
					setTimeout(() => otpInputRef.current?.focus(), 350);
				}
			} else {
				setStep("username");
				setTimeout(() => usernameInputRef.current?.focus(), 350);
			}
		} catch (e) {
			setLoadingLocal(false);
			setError("Failed to check email status");
		}
	};

	const handleUsernameSubmit = async () => {
		if (!username.trim() || loading || loadingLocal) return;
		setError(null);

		const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
		if (!usernameRegex.test(username.trim())) {
			setError("Username must be 3-30 characters (letters, numbers, underscores)");
			return;
		}

		setLoadingLocal(true);
		const success = await onSendOtp();
		setLoadingLocal(false);

		if (success) {
			setStep("otp");
			setResendTimer(30);
			setTimeout(() => otpInputRef.current?.focus(), 350);
		}
	};

	const handleOtpSubmit = () => {
		if (otp.length === OTP_LENGTH && !loading) {
			void onVerifyOtp();
		}
	};

	const handleResend = async () => {
		if (resendTimer > 0 || loading) return;
		setError(null);
		onChangeOtp("");
		const success = await onSendOtp();
		if (success) {
			setResendTimer(30);
			void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}
	};

	const handlePasteMockCode = () => {
		void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setError(null);
		otpInputRef.current?.focus();
	};

	const otpChars = otp.split("");

	if (!visible && translateY.value >= SCREEN_H - 10) return null;

	return (
		<View style={styles.portal} pointerEvents={visible ? "auto" : "none"}>
			<Animated.View style={[styles.scrim, scrimStyle]}>
				<Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
			</Animated.View>

			<GestureDetector gesture={panGesture}>
				<Animated.View style={[styles.sheet, sheetStyle]}>
					<View style={styles.handleWrap}>
						<View style={styles.handle} />
					</View>

					{step === "email" ? (
						<View style={styles.content}>
							<View style={styles.header}>
								<Text style={styles.title}>JOIN YOUR SLAP VAULT ⚡</Text>
								<Text style={styles.subtitle}>
									Save your favorite stickers, sync across devices.
								</Text>
							</View>

							{error ? (
								<View style={styles.errorRow}>
									<Text style={styles.errorText}>{error}</Text>
								</View>
							) : null}

							<View style={styles.inputWrap}>
								<Ionicons
									name="mail-outline"
									size={18}
									color="#A3A3B3"
								/>
								<TextInput
									ref={emailInputRef}
									value={email}
									onChangeText={onChangeEmail}
									placeholder="ENTER EMAIL"
									placeholderTextColor="#555555"
									keyboardType="email-address"
									autoCapitalize="none"
									autoCorrect={false}
									returnKeyType="next"
									onSubmitEditing={handleEmailSubmit}
									style={styles.input}
								/>
							</View>

							<BrutalistSheetButton
								label={loading || loadingLocal ? "SENDING..." : "CONTINUE →"}
								onPress={handleEmailSubmit}
								disabled={!email.trim() || loading || loadingLocal}
							/>
						</View>
					) : step === "username" ? (
						<View style={styles.content}>
							<View style={styles.header}>
								<Text style={styles.title}>CHOOSE A USERNAME ⚡</Text>
								<Text style={styles.subtitle}>
									This is how you will be known on Slap.
								</Text>
							</View>

							{error ? (
								<View style={styles.errorRow}>
									<Text style={styles.errorText}>{error}</Text>
								</View>
							) : null}

							<View style={styles.inputWrap}>
								<Ionicons
									name="at-outline"
									size={18}
									color="#A3A3B3"
								/>
								<TextInput
									ref={usernameInputRef}
									value={username}
									onChangeText={onChangeUsername}
									placeholder="USERNAME"
									placeholderTextColor="#555555"
									autoCapitalize="none"
									autoCorrect={false}
									returnKeyType="next"
									onSubmitEditing={handleUsernameSubmit}
									style={styles.input}
								/>
							</View>

							<BrutalistSheetButton
								label={loading || loadingLocal ? "CONTINUE →" : "CONTINUE →"}
								onPress={handleUsernameSubmit}
								disabled={!username.trim() || loading || loadingLocal}
							/>

							<Pressable
								onPress={() => {
									setError(null);
									setStep("email");
									setTimeout(() => emailInputRef.current?.focus(), 350);
								}}
								style={styles.backLink}
							>
								<Text style={styles.backText}>GO BACK</Text>
							</Pressable>
						</View>
					) : (
						<View style={styles.content}>
							<View style={styles.header}>
								<Text style={styles.title}>ALMOST THERE.</Text>
								<Text style={styles.subtitle}>
									Enter the code sent to:{"\n"}
									<Text style={styles.emailHighlight}>{email}</Text>
								</Text>
							</View>

							{error ? (
								<View style={styles.errorRow}>
									<Text style={styles.errorText}>{error}</Text>
								</View>
							) : null}

							{/* Big, minimal Brutalist OTP cells */}
							<Pressable
								onPress={() => otpInputRef.current?.focus()}
								style={styles.otpRow}
							>
								{Array.from({ length: OTP_LENGTH }).map((_, i) => (
									<View
										key={i}
										style={[
											styles.otpCell,
											otpChars[i] && styles.otpCellFilled,
											i === otp.length && styles.otpCellActive,
										]}
									>
										<Text style={styles.otpChar}>{otpChars[i] || ""}</Text>
									</View>
								))}
							</Pressable>

							<TextInput
								ref={otpInputRef}
								value={otp}
								onChangeText={(val) => {
									onChangeOtp(val);
									if (val.length === OTP_LENGTH) {
										Keyboard.dismiss();
									}
								}}
								keyboardType="number-pad"
								maxLength={OTP_LENGTH}
								style={styles.hiddenInput}
								onSubmitEditing={handleOtpSubmit}
								returnKeyType="done"
								textContentType="oneTimeCode"
								autoComplete="one-time-code"
							/>

							<BrutalistSheetButton
								label={loading ? "VERIFYING..." : "VERIFY"}
								onPress={handleOtpSubmit}
								disabled={otp.length !== OTP_LENGTH || loading}
							/>

							{/* Paste & Resend action list */}
							<View style={styles.helperActions}>
								<Pressable
									onPress={handlePasteMockCode}
									style={({ pressed }) => [
										styles.helperBtn,
										pressed && styles.helperPressed,
									]}
								>
									<Ionicons name="copy-outline" size={14} color="#FFF500" />
									<Text style={styles.helperText}>PASTE CODE AUTOMATICALLY</Text>
								</Pressable>

								<Pressable
									onPress={handleResend}
									disabled={resendTimer > 0 || loading}
									style={({ pressed }) => [
										styles.helperBtn,
										(resendTimer > 0 || loading) && styles.helperDisabled,
										pressed && styles.helperPressed,
									]}
								>
									<Ionicons
										name="refresh-outline"
										size={14}
										color={resendTimer > 0 ? "#A3A3B3" : "#FFF500"}
									/>
									<Text
										style={[
											styles.helperText,
											resendTimer === 0 && { color: "#FFF500" },
										]}
									>
										{resendTimer > 0 ? `RESEND IN ${resendTimer}S` : "RESEND CODE"}
									</Text>
								</Pressable>
							</View>

							<Pressable
								onPress={() => {
									setError(null);
									onChangeOtp("");
									setStep("email");
									setTimeout(() => emailInputRef.current?.focus(), 350);
								}}
								style={styles.backLink}
							>
								<Text style={styles.backText}>USE A DIFFERENT EMAIL</Text>
							</Pressable>
						</View>
					)}
				</Animated.View>
			</GestureDetector>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	portal: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "flex-end",
		zIndex: 1000,
	},
	scrim: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.92)", // Solid, heavy overlay
	},
	sheet: {
		backgroundColor: "#0A0A0A", // Raw dark grey
		height: SCREEN_H,
		width: "100%",
		paddingHorizontal: theme.spacing["2xl"],
		paddingTop: 64,
		paddingBottom: 44,
	},
	handleWrap: {
		paddingVertical: 12,
		alignItems: "center",
		marginTop: 8,
	},
	handle: {
		width: 44,
		height: 4,
		borderRadius: 2,
		backgroundColor: "#333333",
	},
	content: {
		flex: 1,
		gap: 28,
		marginTop: theme.spacing.lg,
	},
	header: {
		gap: theme.spacing.xs,
	},
	title: {
		color: "#FFF500", // Cyber-Yellow title
		fontSize: 24,
		fontWeight: "900",
		letterSpacing: -0.5,
	},
	subtitle: {
		color: "#A3A3B3",
		fontSize: theme.fontSize.base,
		lineHeight: 22,
		fontWeight: "900",
	},
	emailHighlight: {
		color: "#FFFFFF",
		fontWeight: "900",
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
	inputWrap: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.spacing.sm,
		backgroundColor: "#1A1A1A",
		borderWidth: 3,
		borderColor: "#000000",
		borderRadius: 4, // Sharp corners
		paddingHorizontal: theme.spacing.md,
		minHeight: 52,
	},
	input: {
		flex: 1,
		color: "#FFFFFF",
		fontSize: theme.fontSize.base,
		fontWeight: "900",
		paddingVertical: 14,
	},
	otpRow: {
		flexDirection: "row",
		gap: theme.spacing.xs,
		justifyContent: "space-between",
	},
	otpCell: {
		width: 46,
		height: 60,
		borderRadius: 4, // Sharp corners
		backgroundColor: "#1A1A1A",
		borderWidth: 3,
		borderColor: "#000000",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		shadowOffset: { width: 3, height: 3 },
		elevation: 4,
	},
	otpCellFilled: {
		borderColor: "#FFF500", // Cyber-Yellow highlight
	},
	otpCellActive: {
		borderColor: "#FFF500",
	},
	otpChar: {
		color: "#FFFFFF",
		fontSize: 22,
		fontWeight: "900",
	},
	hiddenInput: {
		position: "absolute",
		width: 1,
		height: 1,
		opacity: 0,
	},
	brutalistBtnWrapper: {
		position: "relative",
		height: 52,
	},
	brutalistBtnBody: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#FFF500", // Primary Cyber-Yellow
		borderWidth: 3,
		borderColor: "#000000",
		borderRadius: 4,
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		shadowOffset: { width: 4, height: 4 },
		elevation: 5,
	},
	btnDisabled: {
		opacity: 0.55,
	},
	brutalistBtnText: {
		color: "#000000",
		fontSize: theme.fontSize.base,
		fontWeight: "900",
		letterSpacing: 0.5,
	},
	helperActions: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: -4,
	},
	helperBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingVertical: theme.spacing.xs,
	},
	helperText: {
		color: "#A3A3B3",
		fontSize: 10,
		fontWeight: "900",
		letterSpacing: 0.2,
	},
	helperPressed: {
		opacity: 0.65,
	},
	helperDisabled: {
		opacity: 0.45,
	},
	backLink: {
		alignItems: "center",
		marginTop: 8,
	},
	backText: {
		color: "#A3A3B3",
		fontSize: theme.fontSize.sm,
		fontWeight: "900",
		textDecorationLine: "underline",
	},
}));
