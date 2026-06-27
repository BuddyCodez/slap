const { withAppDelegate, withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withWhatsAppStickers = (config) => {
	config = withAppDelegate(config, async (config) => {
		// iOS: native module is auto-linked during prebuild by CocoaPods
		return config;
	});

	config = withAndroidManifest(config, async (config) => {
		const manifest = config.modResults;

		// Android: Add WhatsApp to package queries for API level 30+
		if (!manifest.queries) {
			manifest.queries = [];
		}

		// Check if WhatsApp query already exists
		const hasWhatsApp = manifest.queries.some(
			(q) =>
				q.package && q.package[0]?.["$"]?.["android:name"] === "com.whatsapp",
		);

		if (!hasWhatsApp) {
			manifest.queries.push({
				package: [
					{
						$: {
							"android:name": "com.whatsapp",
						},
					},
				],
			});
		}

		return config;
	});

	// Add aaptOptions for WebP image compression handling (required by react-native-wa-stickers-animated)
	config = withDangerousMod(config, [
		"android",
		async (config) => {
			const buildGradlePath = path.join(config.modRequest.projectRoot, "android", "app", "build.gradle");

			if (!fs.existsSync(buildGradlePath)) {
				return config;
			}

			let buildGradleContent = fs.readFileSync(buildGradlePath, "utf-8");

			// Check if aaptOptions already exists
			if (!buildGradleContent.includes("aaptOptions")) {
				// Find the android block and insert aaptOptions before its closing brace
				const androidBlockRegex = /^android\s*\{[\s\S]*?^}/m;
				const match = buildGradleContent.match(androidBlockRegex);

				if (match) {
					// Find the last closing brace of the android block
					const androidBlockStart = match.index;
					const androidBlockEnd = androidBlockStart + match[0].length;
					const insertPosition = androidBlockEnd - 1;

					const aaptOptionsBlock = `    aaptOptions {
        noCompress "webp"
    }
`;

					buildGradleContent =
						buildGradleContent.slice(0, insertPosition) +
						aaptOptionsBlock +
						buildGradleContent.slice(insertPosition);

					fs.writeFileSync(buildGradlePath, buildGradleContent, "utf-8");
				}
			}

			return config;
		},
	]);

	return config;
};

module.exports = withWhatsAppStickers;
