import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Modal, Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type StickerActionSheetProps = {
	visible: boolean;
	onClose: () => void;
	onCopyToClipboard: () => Promise<void>;
	onShareToWhatsApp: () => Promise<void>;
	onDownload: () => Promise<void>;
	isLoading?: boolean;
};

export function StickerActionSheet({
	visible,
	onClose,
	onCopyToClipboard,
	onShareToWhatsApp,
	onDownload,
	isLoading = false,
}: StickerActionSheetProps) {
	const { theme } = useUnistyles();

	const handleAction = async (action: () => Promise<void>) => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			await action();
			onClose();
		} catch (error) {
			void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			console.error("Action failed:", error);
		}
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
			statusBarTranslucent
		>
			{/* Overlay backdrop */}
			<Pressable style={styles.backdrop} onPress={onClose} />

			{/* Action sheet container */}
			<View style={styles.container}>
				<View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
					{/* Copy to Clipboard */}
					<ActionButton
						icon="copy"
						label="Copy to Clipboard"
						onPress={() => handleAction(onCopyToClipboard)}
						disabled={isLoading}
					/>

					{/* Share to WhatsApp */}
					<ActionButton
						icon="logo-whatsapp"
						label="Share to WhatsApp"
						onPress={() => handleAction(onShareToWhatsApp)}
						disabled={isLoading}
					/>

					{/* Download */}
					<ActionButton
						icon="download"
						label="Download"
						onPress={() => handleAction(onDownload)}
						disabled={isLoading}
					/>

					{/* Close button */}
					<View style={styles.divider} />
					<Pressable
						style={({ pressed }) => [
							styles.actionButton,
							pressed && styles.actionButtonPressed,
						]}
						onPress={onClose}
						disabled={isLoading}
					>
						<Text style={[styles.actionLabel, { color: theme.colors.foreground }]}>
							Cancel
						</Text>
					</Pressable>
				</View>
			</View>
		</Modal>
	);
}

type ActionButtonProps = {
	icon: string;
	label: string;
	onPress: () => Promise<void>;
	disabled?: boolean;
};

function ActionButton({ icon, label, onPress, disabled = false }: ActionButtonProps) {
	const { theme } = useUnistyles();

	return (
		<Pressable
			style={({ pressed }) => [
				styles.actionButton,
				pressed && !disabled && styles.actionButtonPressed,
				disabled && styles.actionButtonDisabled,
			]}
			onPress={onPress}
			disabled={disabled}
		>
			<Ionicons
				name={icon as any}
				size={20}
				color={disabled ? theme.colors.mutedForeground : theme.colors.primary}
			/>
			<Text
				style={[
					styles.actionLabel,
					{
						color: disabled ? theme.colors.mutedForeground : theme.colors.foreground,
					},
				]}
			>
				{label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create((theme) => ({
	backdrop: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	container: {
		flex: 1,
		justifyContent: "flex-end",
	},
	sheet: {
		borderTopLeftRadius: theme.borderRadius.xl,
		borderTopRightRadius: theme.borderRadius.xl,
		paddingBottom: 20,
		paddingTop: 8,
	},
	actionButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
		gap: theme.spacing.md,
	},
	actionButtonPressed: {
		backgroundColor: theme.colors.surfaceElevated,
	},
	actionButtonDisabled: {
		opacity: 0.5,
	},
	actionLabel: {
		fontSize: theme.fontSize.base,
		fontWeight: theme.fontWeight.medium,
	},
	divider: {
		height: 1,
		backgroundColor: theme.colors.border,
		marginVertical: theme.spacing.xs,
	},
}));
