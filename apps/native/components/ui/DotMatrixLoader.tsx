import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const GRID = 5;
const FILL_LAST = GRID + GRID - 1;
const BLINK_STEPS = 4;
const BLINK_OPACITIES = [0.38, 1, 0.38, 1] as const;
const DRAIN_LAST = FILL_LAST;
const SEQUENCE_LEN = FILL_LAST + 1 + BLINK_STEPS + DRAIN_LAST + 1;

const BASE_OPACITY = 0.08;
const SETTLED_OPACITY = 0.52;
const CAP_OPACITY = 1;

interface DotMatrixLoaderProps {
	size?: number;
	color?: string;
	speed?: number;
}

function getDotOpacity(row: number, col: number, step: number): number {
	let height = 0;
	let blinkOpacity: number | null = null;

	if (step <= FILL_LAST) {
		height = Math.max(0, Math.min(GRID, step - col));
	} else if (step < FILL_LAST + 1 + BLINK_STEPS) {
		height = GRID;
		blinkOpacity = BLINK_OPACITIES[step - (FILL_LAST + 1)] ?? 1;
	} else {
		const drainTick = step - (FILL_LAST + 1 + BLINK_STEPS);
		height = Math.max(0, Math.min(GRID, GRID - Math.max(0, drainTick - col)));
	}

	const topLitRow = GRID - height;
	const isLit = height > 0 && row >= topLitRow && row <= GRID - 1;

	if (!isLit) return BASE_OPACITY;
	if (blinkOpacity !== null) return blinkOpacity;

	const isCap = row === topLitRow && height > 0 && height < GRID;
	return isCap ? CAP_OPACITY : SETTLED_OPACITY;
}

export function DotMatrixLoader({
	size = 40,
	color = "#FFF500",
	speed = 1,
}: DotMatrixLoaderProps) {
	const [step, setStep] = useState(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		const ms = Math.max(40, Math.round(2000 / (SEQUENCE_LEN * speed)));
		intervalRef.current = setInterval(() => {
			setStep((prev) => (prev + 1) % SEQUENCE_LEN);
		}, ms);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [speed]);

	const dotSize = size / (GRID + GRID - 1);
	const gap = dotSize;

	const dots = useMemo(() => {
		const result: { key: string; row: number; col: number; opacity: number }[] = [];
		for (let r = 0; r < GRID; r++) {
			for (let c = 0; c < GRID; c++) {
				result.push({
					key: `${r}-${c}`,
					row: r,
					col: c,
					opacity: getDotOpacity(r, c, step),
				});
			}
		}
		return result;
	}, [step]);

	return (
		<View style={[styles.grid, { width: size, height: size }]}>
			{dots.map((dot) => (
				<View
					key={dot.key}
					style={[
						styles.dot,
						{
							width: dotSize,
							height: dotSize,
							borderRadius: dotSize / 2,
							backgroundColor: color,
							opacity: dot.opacity,
						},
					]}
				/>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		alignContent: "space-between",
	},
	dot: {},
});
