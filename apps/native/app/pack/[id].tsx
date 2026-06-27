import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Image, Linking, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Screen } from "@/components/ui/screen";
import { DotMatrixLoader } from "@/components/ui/DotMatrixLoader";
import { orpc, queryClient } from "@/utils/orpc";
import { formatCount } from "@/utils/format";
import { addPackToWhatsApp } from "@/utils/whatsapp";
import { downloadPackToGallery } from "@/utils/download";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);

export default function PackDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isSaved, setIsSaved] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState(false);
  const [whatsappFeedback, setWhatsappFeedback] = useState(false);

  const { data: pack, isLoading } = useQuery(
    orpc.packs.get.queryOptions({ input: { packId: id || "" } }),
  );

  const saveMutation = useMutation({
    ...orpc.saves.save.mutationOptions(),
    onSuccess: () => {
      setIsSaved(true);
      queryClient.invalidateQueries({
        queryKey: orpc.saves.list.queryKey({ input: {} }),
      });
      queryClient.invalidateQueries({
        queryKey: orpc.packs.get.queryKey({ input: { packId: id || "" } }),
      });
    },
  });

  const unsaveMutation = useMutation({
    ...orpc.saves.unsave.mutationOptions(),
    onSuccess: () => {
      setIsSaved(false);
      queryClient.invalidateQueries({
        queryKey: orpc.saves.list.queryKey({ input: {} }),
      });
      queryClient.invalidateQueries({
        queryKey: orpc.packs.get.queryKey({ input: { packId: id || "" } }),
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: () => downloadPackToGallery(id || ""),
    onSuccess: () => {
      setDownloadFeedback(true);
      setTimeout(() => setDownloadFeedback(false), 2000);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to download pack";
      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
    },
  });

  const whatsappMutation = useMutation({
    mutationFn: () => addPackToWhatsApp(id || ""),
    onSuccess: () => {
      setWhatsappFeedback(true);
      setTimeout(() => setWhatsappFeedback(false), 2000);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to add to WhatsApp";
      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
    },
  });

  useEffect(() => {
    if (pack) setIsSaved(pack.savedByUser || false);
  }, [pack]);

  const saveScale = useSharedValue(1);
  const downloadScale = useSharedValue(1);
  const whatsappScale = useSharedValue(1);
  const tickerTranslateX = useSharedValue(0);
  const backScale = useSharedValue(1);

  const saveAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));
  const downloadAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: downloadScale.value }],
  }));
  const whatsappAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: whatsappScale.value }],
  }));
  const tickerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tickerTranslateX.value }],
  }));
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  useEffect(() => {
    tickerTranslateX.value = withRepeat(
      withTiming(-1000, { duration: 8000 }),
      -1,
      true,
    );
  }, [tickerTranslateX]);

  const handleSaveToggle = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveScale.value = withSpring(0.95, { damping: 12, stiffness: 300 });
    setTimeout(() => {
      saveScale.value = withSpring(1, { damping: 12, stiffness: 300 });
    }, 100);
    if (isSaved) {
      unsaveMutation.mutate({ packId: id || "" });
    } else {
      saveMutation.mutate({ packId: id || "" });
    }
  };

  const handleDownload = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    downloadScale.value = withSpring(0.95, { damping: 12, stiffness: 300 });
    setTimeout(() => {
      downloadScale.value = withSpring(1, { damping: 12, stiffness: 300 });
    }, 100);
    downloadMutation.mutate();
  };

  const handleWhatsApp = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    whatsappScale.value = withSpring(0.95, { damping: 12, stiffness: 300 });
    setTimeout(() => {
      whatsappScale.value = withSpring(1, { damping: 12, stiffness: 300 });
    }, 100);
    whatsappMutation.mutate();
  };

  const handleBack = () => {
    void Haptics.selectionAsync();
    backScale.value = withSpring(0.95, { damping: 12, stiffness: 300 });
    setTimeout(() => {
      backScale.value = withSpring(1, { damping: 12, stiffness: 300 });
    }, 100);
    router.back();
  };

  if (isLoading || !pack) {
    return (
      <Screen scrollable={false}>
        <View style={styles.loaderWrap}>
          <DotMatrixLoader size={56} />
          <Text style={styles.loaderText}>LOADING PACK...</Text>
        </View>
      </Screen>
    );
  }

  const stickerPreview = pack.stickers.slice(0, 3);

  return (
    <Screen scrollable={false}>
      <SafeAreaProvider>
        <SafeAreaView>
          {/* Sticky floating ISO-style back button */}
          <AnimatedPressable
            onPress={handleBack}
            style={[styles.floatingBack, backAnimStyle]}
          >
            <Ionicons name="chevron-back" size={18} color="#FFF500" />
          </AnimatedPressable>

          <FlatList
            data={pack.stickers}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            ListHeaderComponent={
              <View style={styles.header}>
                {/* Spacer for floating back button */}
                <View style={{ height: 56 }} />

                {/* Hero card */}
                <View style={styles.heroCard}>
                  {/* Hero shadow */}
                  <View style={styles.heroCardShadow} />

                  <View style={styles.thumbWrap}>
                    {pack.thumbnail ? (
                      <Image
                        source={{ uri: pack.thumbnail }}
                        style={styles.thumbImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.thumbPlaceholder}>
                        <Text style={styles.thumbEmoji}>📦</Text>
                      </View>
                    )}

                    {/* Floating sticker previews */}
                    <View style={styles.stickerPreviews}>
                      {stickerPreview.map((s, i) => (
                        <View
                          key={s.id}
                          style={[styles.previewChip, { right: i * 28 }]}
                        >
                          <Image
                            source={{ uri: s.url || undefined }}
                            style={styles.previewImg}
                            resizeMode="contain"
                          />
                        </View>
                      ))}
                    </View>

                    {/* Sticker count badge */}
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {pack.stickers.length}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.heroInfo}>
                    <Text style={styles.packName}>
                      {pack.name.toUpperCase()}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.creatorName}>
                        @{pack.creator.name.toUpperCase()}
                      </Text>
                      {pack.category && (
                        <View style={styles.categoryPill}>
                          <Text style={styles.categoryPillText}>
                            {pack.category.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    {pack.description && (
                      <Text style={styles.description} numberOfLines={3}>
                        {pack.description}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Stats strip - aggressive blocks */}
                <View style={styles.statsStrip}>
                  <View style={styles.statBlock}>
                    <View style={styles.statShadow} />
                    <Text style={styles.statBlockNum}>
                      {formatCount(pack.downloads)}
                    </Text>
                    <Text style={styles.statBlockLabel}>DOWNLOADS</Text>
                  </View>
                  <View style={styles.statBlockDivider} />
                  <View style={styles.statBlock}>
                    <View style={styles.statShadow} />
                    <Text style={styles.statBlockNum}>
                      {formatCount(pack.saves)}
                    </Text>
                    <Text style={styles.statBlockLabel}>SAVES</Text>
                  </View>
                  <View style={styles.statBlockDivider} />
                  <View style={styles.statBlock}>
                    <View style={styles.statShadow} />
                    <Text style={styles.statBlockNum}>
                      {pack.stickers.length}
                    </Text>
                    <Text style={styles.statBlockLabel}>STICKERS</Text>
                  </View>
                </View>

                {/* Marquee ticker */}
                <View style={styles.tickerContainer}>
                  <AnimatedView style={[styles.tickerContent, tickerAnimStyle]}>
                    <Text style={styles.tickerText}>
                      GRAB IT · SLAP IT · SEND IT · GRAB IT · SLAP IT · SEND IT
                      ·{" "}
                    </Text>
                  </AnimatedView>
                </View>

                {/* Action buttons — redesigned */}
                <View style={styles.actions}>
                  {/* SAVE button — primary accent */}
                  <AnimatedPressable
                    onPress={handleSaveToggle}
                    disabled={
                      saveMutation.isPending || unsaveMutation.isPending
                    }
                    style={[
                      styles.saveBtn,
                      isSaved && styles.saveBtnActive,
                      saveAnimStyle,
                    ]}
                  >
                    <View style={styles.btnShadow} />
                    <Ionicons
                      name={isSaved ? "heart" : "heart-outline"}
                      size={22}
                      color={isSaved ? "#000000" : "#FFF500"}
                    />
                    <Text
                      style={[
                        styles.saveBtnLabel,
                        isSaved && styles.saveBtnLabelActive,
                      ]}
                    >
                      {isSaved ? "SAVED" : "SAVE"}
                    </Text>
                  </AnimatedPressable>

                  {/* GET button — white/high contrast */}
                  <AnimatedPressable
                    onPress={handleDownload}
                    disabled={downloadMutation.isPending}
                    style={[styles.getBtn, downloadAnimStyle]}
                  >
                    <View style={styles.getBtnShadow} />
                    {downloadMutation.isPending ? (
                      <DotMatrixLoader size={20} color="#000000" />
                    ) : (
                      <>
                        <Ionicons
                          name={
                            downloadFeedback
                              ? "checkmark-circle"
                              : "download-outline"
                          }
                          size={22}
                          color={downloadFeedback ? "#22c55e" : "#000000"}
                        />
                        <Text
                          style={[
                            styles.getBtnLabel,
                            downloadFeedback && { color: "#22c55e" },
                          ]}
                        >
                          {downloadFeedback ? "GOT IT!" : "GET"}
                        </Text>
                      </>
                    )}
                  </AnimatedPressable>

                  {/* WhatsApp button — green, icon-only */}
                  <AnimatedPressable
                    onPress={handleWhatsApp}
                    disabled={whatsappMutation.isPending}
                    style={[
                      styles.waBtn,
                      whatsappFeedback && styles.waBtnSuccess,
                      whatsappAnimStyle,
                    ]}
                  >
                    <View style={styles.waBtnShadow} />
                    {whatsappMutation.isPending ? (
                      <DotMatrixLoader size={20} color="#ffffff" />
                    ) : (
                      <Ionicons
                        name={whatsappFeedback ? "checkmark-circle" : "logo-whatsapp"}
                        size={24}
                        color={whatsappFeedback ? "#22c55e" : "#ffffff"}
                      />
                    )}
                  </AnimatedPressable>
                </View>

                {/* Tags */}
                {pack.tags.length > 0 && (
                  <View style={styles.tagsWrap}>
                    {pack.tags.map((tag, idx) => (
                      <View
                        key={tag}
                        style={[
                          styles.tag,
                          {
                            transform: [
                              { rotate: idx % 2 === 0 ? "-1deg" : "1deg" },
                            ],
                          },
                        ]}
                      >
                        <Text style={styles.tagText}>#{tag.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Section header */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionTitle}>ALL STICKERS</Text>
                </View>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.stickerCell}>
                <View style={styles.stickerCardShadow} />
                <View style={styles.stickerCard}>
                  <Image
                    source={{ uri: item.url || undefined }}
                    style={styles.stickerImg}
                    resizeMode="contain"
                  />
                </View>
              </View>
            )}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loaderText: {
    color: "#707070",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  // ─── Sticky floating back button ───────────────────────────────────────────
  floatingBack: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#111111",
    borderWidth: 1.5,
    borderColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  gridContent: {
    paddingBottom: theme.spacing["4xl"],
  },
  gridRow: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  header: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  heroCard: {
    marginHorizontal: theme.spacing.lg,
    backgroundColor: "#1A1A1A",
    borderWidth: 3,
    borderColor: "#000000",
    borderRadius: 0,
    overflow: "visible",
  },
  heroCardShadow: {
    position: "absolute",
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    backgroundColor: "#000000",
    borderRadius: 0,
    zIndex: -1,
  },
  thumbWrap: {
    height: 180,
    backgroundColor: "#0D0D0D",
    position: "relative",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbEmoji: {
    fontSize: 48,
  },
  stickerPreviews: {
    position: "absolute",
    bottom: -16,
    right: 16,
    flexDirection: "row-reverse",
    height: 40,
  },
  previewChip: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: "#FFF500",
    backgroundColor: "#1A1A1A",
    overflow: "hidden",
  },
  previewImg: {
    width: "100%",
    height: "100%",
  },
  countBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#000000",
    borderRadius: 0,
    borderWidth: 2,
    borderColor: "#FFF500",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countBadgeText: {
    color: "#FFF500",
    fontSize: 11,
    fontWeight: "900",
  },
  heroInfo: {
    padding: 16,
    paddingTop: 24,
    gap: 6,
  },
  packName: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  creatorName: {
    color: "#FFF500",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  categoryPill: {
    backgroundColor: "#FFF500",
    borderWidth: 2,
    borderColor: "#FFF500",
    borderRadius: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryPillText: {
    color: "#000000",
    fontSize: 9,
    fontWeight: "900",
  },
  description: {
    color: "#888888",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  statsStrip: {
    flexDirection: "row",
    marginHorizontal: theme.spacing.lg,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#000000",
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    gap: 2,
    backgroundColor: "#FFF500",
    position: "relative",
  },
  statShadow: {
    position: "absolute",
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    backgroundColor: "#000000",
    zIndex: -1,
  },
  statBlockNum: {
    color: "#000000",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  statBlockLabel: {
    color: "#707070",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  statBlockDivider: {
    width: 2,
    backgroundColor: "#000000",
    marginVertical: 0,
  },

  // ─── Redesigned Action Buttons ──────────────────────────────────────────────
  actions: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    gap: 12,
    alignItems: "stretch",
  },
  // SAVE button — YEL accent, prominent
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    minHeight: 56,
    backgroundColor: "#111111",
    borderWidth: 3,
    borderColor: "#FFF500",
    borderRadius: 0,
    position: "relative",
  },
  saveBtnActive: {
    backgroundColor: "#FFF500",
    borderColor: "#FFF500",
  },
  btnShadow: {
    position: "absolute",
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: "#000000",
    zIndex: -1,
  },
  saveBtnLabel: {
    color: "#FFF500",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  saveBtnLabelActive: {
    color: "#000000",
  },
  // GET button — white fill, max contrast
  getBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    minHeight: 56,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#000000",
    borderRadius: 0,
    position: "relative",
  },
  getBtnShadow: {
    position: "absolute",
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: "#000000",
    zIndex: -1,
  },
  getBtnLabel: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  // WhatsApp button — green, square icon-only
  waBtn: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    borderWidth: 3,
    borderColor: "#000000",
    borderRadius: 0,
    position: "relative",
  },
  waBtnShadow: {
    position: "absolute",
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: "#000000",
    zIndex: -1,
  },
  waBtnSuccess: {
    backgroundColor: "#22c55e",
  },

  tickerContainer: {
    backgroundColor: "#FFF500",
    paddingVertical: 6,
    overflow: "hidden",
    marginHorizontal: theme.spacing.lg,
  },
  tickerContent: {
    flexDirection: "row",
  },
  tickerText: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: theme.spacing.lg,
    gap: 6,
  },
  tag: {
    backgroundColor: "#000000",
    borderRadius: 0,
    borderWidth: 2,
    borderColor: "#FFF500",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: "#FFF500",
    fontSize: 10,
    fontWeight: "900",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    backgroundColor: "#FFF500",
    borderRadius: 0,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  stickerCell: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 4,
  },
  stickerCardShadow: {
    position: "absolute",
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    backgroundColor: "#FFF500",
    borderRadius: 0,
    zIndex: -1,
  },
  stickerCard: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 0,
    borderWidth: 2,
    borderColor: "#000000",
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  stickerImg: {
    width: "100%",
    height: "100%",
  },
}));
