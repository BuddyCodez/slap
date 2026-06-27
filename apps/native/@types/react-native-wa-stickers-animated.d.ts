declare module 'react-native-wa-stickers-animated' {
  interface StickerPackConfig {
    identifier: string;
    name: string;
    publisher: string;
    trayImageFileName: string;
    publisherEmail: string;
    publisherWebsite: string;
    privacyPolicyWebsite: string;
    licenseAgreementWebsite: string;
  }

  interface AndroidStickerConfig {
    image_file: string;
    emojis: string[];
  }

  interface AndroidPrepareConfig {
    identifier: string;
    name: string;
    publisher: string;
    tray_image_file: string;
    publisher_email: string;
    publisher_website: string;
    privacy_policy_website: string;
    license_agreement_website: string;
    image_data_version: string;
    avoid_cache: boolean;
    animated_sticker_pack: boolean;
    stickers: AndroidStickerConfig[];
  }

  interface RNWhatsAppStickers {
    createStickerPack(config: StickerPackConfig): Promise<void>;
    addSticker(filename: string, emojis: string[]): Promise<void>;
    send(packId?: string, packName?: string): Promise<void>;
    prepare(configJson: string): Promise<void>;
  }

  const RNWhatsAppStickers: RNWhatsAppStickers;
  export default RNWhatsAppStickers;
}
