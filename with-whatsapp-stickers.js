const {
	withAppDelegate,
	withAndroidManifest,
	withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withWhatsAppStickers = (config) => {
	config = withAppDelegate(config, async (config) => {
		// iOS: native module is auto-linked during prebuild by CocoaPods
		return config;
	});

	// Add aaptOptions for WebP image compression and AndroidManifest queries for WhatsApp
	config = withDangerousMod(config, [
		"android",
		async (config) => {
			// 0. Fix react-native-wa-stickers-animated Java compatibility issue
			// Arguments() constructor is private in newer React Native, use static method instead
			const waStickersModulePath = path.join(
				config.modRequest.projectRoot,
				"..",
				"..",
				"node_modules",
				".bun",
				"react-native-wa-stickers-animated@2.0.18",
				"node_modules",
				"react-native-wa-stickers-animated",
				"android",
				"src",
				"main",
				"java",
				"com",
				"jobeso",
				"RNWhatsAppStickers",
				"RNWhatsAppStickersModule.java",
			);

			if (fs.existsSync(waStickersModulePath)) {
				let javaContent = fs.readFileSync(waStickersModulePath, "utf-8");

				// Fix: Arguments.createMap() instead of new Arguments().createMap()
				if (javaContent.includes("new Arguments().createMap()")) {
					javaContent = javaContent.replace(
						/new Arguments\(\)\.createMap\(\)/g,
						"Arguments.createMap()",
					);
					fs.writeFileSync(waStickersModulePath, javaContent, "utf-8");
				}
			}

			// 1. Add aaptOptions to build.gradle
			const buildGradlePath = path.join(
				config.modRequest.projectRoot,
				"android",
				"app",
				"build.gradle",
			);

			if (fs.existsSync(buildGradlePath)) {
				let buildGradleContent = fs.readFileSync(buildGradlePath, "utf-8");

				if (!buildGradleContent.includes("aaptOptions")) {
					const androidBlockRegex = /^android\s*\{[\s\S]*?^}/m;
					const match = buildGradleContent.match(androidBlockRegex);

					if (match) {
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
			}

			// 2. Add WhatsApp to AndroidManifest.xml queries
			const manifestPath = path.join(
				config.modRequest.projectRoot,
				"android",
				"app",
				"src",
				"main",
				"AndroidManifest.xml",
			);

			if (fs.existsSync(manifestPath)) {
				let manifestContent = fs.readFileSync(manifestPath, "utf-8");

				// Check if WhatsApp package query already exists
				if (!manifestContent.includes('android:name="com.whatsapp"')) {
					// Insert WhatsApp package query into the existing <queries> block
					// Find the closing </queries> tag that's inside <manifest>
					const queriesCloseTag = "</queries>";
					const lastQueriesIndex = manifestContent.lastIndexOf(queriesCloseTag);

					if (lastQueriesIndex !== -1) {
						const whatsappPackageQuery = `
      <package android:name="com.whatsapp"/>`;

						manifestContent =
							manifestContent.slice(0, lastQueriesIndex) +
							whatsappPackageQuery +
							"\n    " +
							manifestContent.slice(lastQueriesIndex);

						fs.writeFileSync(manifestPath, manifestContent, "utf-8");
					}
				}
			}

			return config;
		},
	]);

	return config;
};

module.exports = withWhatsAppStickers;
